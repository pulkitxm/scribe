
import os
import argparse
import subprocess
import glob
import sys
import platform
import json
import hashlib
from pathlib import Path

def get_file_hash(filepath):
    """Get MD5 hash of a file."""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def load_index(index_path):
    """Load the index file containing processed images metadata."""
    if os.path.exists(index_path):
        try:
            with open(index_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: Could not parse index file {index_path}, starting fresh")
            return {"images": {}, "version": "1.0"}
    return {"images": {}, "version": "1.0"}

def save_index(index_path, index_data):
    """Save the index file."""
    with open(index_path, 'w') as f:
        json.dump(index_data, f, indent=2)

def get_image_metadata(image_path):
    """Get metadata for an image file."""
    stat = os.stat(image_path)
    return {
        "path": image_path,
        "mtime": stat.st_mtime,
        "size": stat.st_size,
        "hash": get_file_hash(image_path)
    }

def detect_changes(images, index_data):
    """Detect new or changed images compared to index."""
    indexed_images = index_data.get("images", {})
    new_images = []
    changed_images = []
    unchanged_images = []
    
    for img_path in images:
        img_key = os.path.basename(img_path)
        
        if img_key not in indexed_images:
            new_images.append(img_path)
        else:
            # Check if file has changed
            old_meta = indexed_images[img_key]
            stat = os.stat(img_path)
            
            # Quick check: mtime and size
            if old_meta["mtime"] != stat.st_mtime or old_meta["size"] != stat.st_size:
                # Verify with hash
                current_hash = get_file_hash(img_path)
                if current_hash != old_meta["hash"]:
                    changed_images.append(img_path)
                else:
                    unchanged_images.append(img_path)
            else:
                unchanged_images.append(img_path)
    
    return new_images, changed_images, unchanged_images

def detect_gpu_encoder():
    """Detect available GPU encoder for ffmpeg."""
    # Check what encoders are available
    try:
        result = subprocess.run(
            ["ffmpeg", "-hide_banner", "-encoders"],
            capture_output=True,
            text=True,
            timeout=5
        )
        encoders = result.stdout
        
        system = platform.system()
        
        # Priority order of encoders to try
        if system == "Darwin":  # macOS
            # VideoToolbox (Apple Silicon/Intel)
            if "h264_videotoolbox" in encoders:
                return "h264_videotoolbox", "VideoToolbox (Apple GPU)"
        elif system == "Linux" or system == "Windows":
            # NVIDIA NVENC
            if "h264_nvenc" in encoders:
                return "h264_nvenc", "NVIDIA NVENC"
            # AMD AMF (Windows/Linux)
            if "h264_amf" in encoders:
                return "h264_amf", "AMD AMF"
            # Intel QSV
            if "h264_qsv" in encoders:
                return "h264_qsv", "Intel Quick Sync"
        
        # Fallback to software encoder
        return "libx264", "CPU (software)"
    
    except Exception as e:
        print(f"Warning: Could not detect GPU encoder: {e}")
        return "libx264", "CPU (software)"

def create_video_from_images(input_dir, output_file, fps, use_gpu=True, force_rebuild=False):
    """Create or update video from images with incremental processing."""
    
    # Setup index file path
    index_dir = os.path.join(input_dir, ".video_index")
    os.makedirs(index_dir, exist_ok=True)
    index_path = os.path.join(index_dir, "index.json")
    
    # Load existing index
    index_data = load_index(index_path)
    
    # Get all current images
    images = glob.glob(os.path.join(input_dir, "*.webp"))
    
    if not images:
        print(f"No .webp images found in {input_dir}")
        return
    
    images.sort()
    print(f"Found {len(images)} total images in {input_dir}")
    
    # Detect changes
    if not force_rebuild and os.path.exists(output_file):
        new_images, changed_images, unchanged_images = detect_changes(images, index_data)
        
        print(f"  New images: {len(new_images)}")
        print(f"  Changed images: {len(changed_images)}")
        print(f"  Unchanged images: {len(unchanged_images)}")
        
        if not new_images and not changed_images:
            print(f"No changes detected. Video is up to date: {output_file}")
            return
        
        # For incremental update, we need to rebuild with all images
        # but we know which ones changed
        print(f"Changes detected. Rebuilding video with {len(images)} images...")
    else:
        print(f"Building video from scratch with {len(images)} images...")
    
    # Create concat list file
    import uuid
    list_file_path = f"concat_list_{uuid.uuid4().hex}.txt"
    with open(list_file_path, "w") as f:
        for image_path in images:
            # Escape single quotes in filename for ffmpeg
            safe_path = image_path.replace("'", "'\\''")
            f.write(f"file '{safe_path}'\n")
            f.write(f"duration {1/fps}\n")
        
        # Add the last image again to ensure the last frame is shown
        if images:
             safe_path = images[-1].replace("'", "'\\''")
             f.write(f"file '{safe_path}'\n")

    # Detect encoder
    encoder, encoder_name = detect_gpu_encoder() if use_gpu else ("libx264", "CPU (software)")
    print(f"Using encoder: {encoder_name}")
    
    try:
        # Create video using ffmpeg
        cmd = [
            "ffmpeg",
            "-y", 
            "-f", "concat",
            "-safe", "0",
            "-i", list_file_path,
            "-c:v", encoder,
            "-fps_mode", "vfr",
            "-pix_fmt", "yuv420p",
        ]
        
        # Add encoder-specific options
        if encoder == "h264_videotoolbox":
            cmd.extend(["-b:v", "5M"])
        elif encoder == "h264_nvenc":
            cmd.extend(["-preset", "p4", "-b:v", "5M"])
        elif encoder == "h264_amf":
            cmd.extend(["-quality", "balanced", "-b:v", "5M"])
        elif encoder == "h264_qsv":
            cmd.extend(["-preset", "medium", "-b:v", "5M"])
        elif encoder == "libx264":
            cmd.extend(["-preset", "medium", "-crf", "23"])
        
        cmd.append(output_file)
        
        print(f"Encoding video...")
        subprocess.run(cmd, check=True)
        print(f"Video created successfully: {output_file}")
        
        # Update index with all current images
        print("Updating index...")
        index_data["images"] = {}
        for img_path in images:
            img_key = os.path.basename(img_path)
            index_data["images"][img_key] = get_image_metadata(img_path)
        
        save_index(index_path, index_data)
        print(f"Index updated with {len(images)} images")

    except subprocess.CalledProcessError as e:
        print(f"Error creating video: {e}")
        # If GPU encoding failed, try falling back to CPU
        if use_gpu and encoder != "libx264":
            print("GPU encoding failed. Retrying with CPU encoder...")
            create_video_from_images(input_dir, output_file, fps, use_gpu=False, force_rebuild=force_rebuild)
            return
    finally:
        # Clean up the list file
        if os.path.exists(list_file_path):
            os.remove(list_file_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert webp images to video using ffmpeg with GPU acceleration and incremental updates."
    )
    parser.add_argument("--input", required=True, help="Input directory containing .webp images or subdirectories of images")
    parser.add_argument("--output", required=True, help="Output video file path (for single dir) or output directory (for recursive)")
    parser.add_argument("--fps", type=float, default=1.0, help="Frames per second")
    parser.add_argument("--no-gpu", action="store_true", help="Disable GPU acceleration and use CPU encoding")
    parser.add_argument("--force", action="store_true", help="Force rebuild even if no changes detected")

    args = parser.parse_args()

    use_gpu = not args.no_gpu
    force_rebuild = args.force

    # Create videos directory if it doesn't exist
    videos_dir = "./videos"
    if not os.path.exists(videos_dir):
        os.makedirs(videos_dir, exist_ok=True)
        print(f"Created directory: {videos_dir}")

    # Check if input directory has webp images directly
    direct_images = glob.glob(os.path.join(args.input, "*.webp"))

    if direct_images:
        # Direct mode - save to videos folder
        output_filename = os.path.basename(args.output)
        output_path = os.path.join(videos_dir, output_filename)
        print(f"\n{'='*60}")
        print(f"Processing: {args.input}")
        print(f"{'='*60}")
        create_video_from_images(args.input, output_path, args.fps, use_gpu, force_rebuild)
    else:
        # Recursive mode
        print(f"No .webp images found in root of {args.input}. Checking subdirectories...")

        found_subdirs = False
        subdirs = sorted([item for item in os.listdir(args.input) 
                         if os.path.isdir(os.path.join(args.input, item)) 
                         and not item.startswith('.')])
        
        for item in subdirs:
            sub_dir = os.path.join(args.input, item)
            # Check if this subdir has images
            sub_images = glob.glob(os.path.join(sub_dir, "*.webp"))
            if sub_images:
                found_subdirs = True
                # Output filename is the folder name, saved to videos directory
                output_filename = f"{item}.mp4"
                output_path = os.path.join(videos_dir, output_filename)
                print(f"\n{'='*60}")
                print(f"Processing subdirectory: {item}")
                print(f"{'='*60}")
                create_video_from_images(sub_dir, output_path, args.fps, use_gpu, force_rebuild)
        
        if not found_subdirs:
            print(f"No subdirectories with .webp images found in {args.input}")
        else:
            print(f"\n{'='*60}")
            print(f"All videos saved to: {videos_dir}")
            print(f"{'='*60}")
