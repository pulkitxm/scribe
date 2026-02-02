
import os
import argparse
import subprocess
import glob

def create_video_from_images(input_dir, output_file, fps):
    
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

    try:
        # Create video using ffmpeg
        # -y: overwrite output file
        # -f concat: use concatenation format
        # -safe 0: allow unsafe file paths (required for absolute paths)
        # -i lists_file_path: input file containing list of images
        # -fps_mode vfr: variable frame rate to match input durations
        # -pix_fmt yuv420p: pixel format for compatibility
        cmd = [
            "ffmpeg",
            "-y", 
            "-f", "concat",
            "-safe", "0",
            "-i", list_file_path,
            "-fps_mode", "vfr",
            "-pix_fmt", "yuv420p",
            output_file
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        print("Encoding video, this might take a while...")
        subprocess.run(cmd, check=True)
        print(f"Video created successfully: {output_file}")

    except subprocess.CalledProcessError as e:
        print(f"Error creating video: {e}")
    finally:
        # Clean up the list file
        if os.path.exists(list_file_path):
            os.remove(list_file_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert webp images to video using ffmpeg.")
    parser.add_argument("--input", required=True, help="Input directory containing .webp images or subdirectories of images")
    parser.add_argument("--output", required=True, help="Output video file path (for single dir) or output directory (for recursive)")
    parser.add_argument("--fps", type=float, default=1.0, help="Frames per second")

    args = parser.parse_args()

    # Check if input directory has webp images directly
    direct_images = glob.glob(os.path.join(args.input, "*.webp"))

    if direct_images:
        # Direct mode
        create_video_from_images(args.input, args.output, args.fps)
    else:
        # Recursive mode
        print(f"No .webp images found in root of {args.input}. Checking subdirectories...")
        
        # Determine output directory
        # If args.output ends with an extension (like .mp4), treat the parent dir as the output dir
        if os.path.splitext(args.output)[1]:
            output_dir = os.path.dirname(args.output)
        else:
            output_dir = args.output
            
        if not output_dir:
            output_dir = "."
            
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        found_subdirs = False
        for item in os.listdir(args.input):
            sub_dir = os.path.join(args.input, item)
            if os.path.isdir(sub_dir):
                # Check if this subdir has images
                sub_images = glob.glob(os.path.join(sub_dir, "*.webp"))
                if sub_images:
                    found_subdirs = True
                    # Output filename is the folder name
                    output_filename = f"{item}.mp4"
                    output_path = os.path.join(output_dir, output_filename)
                    print(f"Processing subdirectory: {item} -> {output_path}")
                    create_video_from_images(sub_dir, output_path, args.fps)
        
        if not found_subdirs:
            print(f"No subdirectories with .webp images found in {args.input}")
