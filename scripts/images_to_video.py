
import os
import argparse
import subprocess
import glob
import sys
import platform

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

def create_video_from_images(input_dir, output_file, fps, use_gpu=True):
    
    images = glob.glob(os.path.join(input_dir, "*.webp"))
    
    if not images:
        print(f"No .webp images found in {input_dir}")
        return

    
    images.sort()

    print(f"Found {len(images)} images.")

    
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
        # -y: overwrite output file
        # -f concat: use concatenation format
        # -safe 0: allow unsafe file paths (required for absolute paths)
        # -i lists_file_path: input file containing list of images
        # -c:v encoder: video codec/encoder to use
        # -fps_mode vfr: variable frame rate to match input durations
        # -pix_fmt yuv420p: pixel format for compatibility
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
            # VideoToolbox specific options for quality
            cmd.extend(["-b:v", "5M"])  # 5 Mbps bitrate
        elif encoder == "h264_nvenc":
            # NVENC specific options
            cmd.extend(["-preset", "p4", "-b:v", "5M"])
        elif encoder == "h264_amf":
            # AMF specific options
            cmd.extend(["-quality", "balanced", "-b:v", "5M"])
        elif encoder == "h264_qsv":
            # QSV specific options
            cmd.extend(["-preset", "medium", "-b:v", "5M"])
        elif encoder == "libx264":
            # Software encoder options
            cmd.extend(["-preset", "medium", "-crf", "23"])
        
        cmd.append(output_file)
        
        print(f"Running command: {' '.join(cmd)}")
        print("Encoding video, this might take a while...")
        subprocess.run(cmd, check=True)
        print(f"Video created successfully: {output_file}")

    except subprocess.CalledProcessError as e:
        print(f"Error creating video: {e}")
        # If GPU encoding failed, try falling back to CPU
        if use_gpu and encoder != "libx264":
            print("GPU encoding failed. Retrying with CPU encoder...")
            create_video_from_images(input_dir, output_file, fps, use_gpu=False)
            return
    finally:
        # Clean up the list file
        if os.path.exists(list_file_path):
            os.remove(list_file_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert webp images to video using ffmpeg with GPU acceleration.")
    parser.add_argument("--input", required=True, help="Input directory containing .webp images or subdirectories of images")
    parser.add_argument("--output", required=True, help="Output video file path (for single dir) or output directory (for recursive)")
    parser.add_argument("--fps", type=float, default=1.0, help="Frames per second")
    parser.add_argument("--no-gpu", action="store_true", help="Disable GPU acceleration and use CPU encoding")

    args = parser.parse_args()

    use_gpu = not args.no_gpu

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
        create_video_from_images(args.input, output_path, args.fps, use_gpu)
    else:
        # Recursive mode
        print(f"No .webp images found in root of {args.input}. Checking subdirectories...")

        found_subdirs = False
        for item in os.listdir(args.input):
            sub_dir = os.path.join(args.input, item)
            if os.path.isdir(sub_dir):
                # Check if this subdir has images
                sub_images = glob.glob(os.path.join(sub_dir, "*.webp"))
                if sub_images:
                    found_subdirs = True
                    # Output filename is the folder name, saved to videos directory
                    output_filename = f"{item}.mp4"
                    output_path = os.path.join(videos_dir, output_filename)
                    print(f"Processing subdirectory: {item} -> {output_path}")
                    create_video_from_images(sub_dir, output_path, args.fps, use_gpu)
        
        if not found_subdirs:
            print(f"No subdirectories with .webp images found in {args.input}")
