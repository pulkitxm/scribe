
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

    
    list_file_path = "concat_list.txt"
    with open(list_file_path, "w") as f:
        for image_path in images:
            
            safe_path = image_path.replace("'", "'\\''")
            f.write(f"file '{safe_path}'\n")
            f.write(f"duration {1/fps}\n")
        
        
        if images:
             safe_path = images[-1].replace("'", "'\\''")
             f.write(f"file '{safe_path}'\n")

    try:
        
        
        
        
        
        
        cmd = [
            "ffmpeg",
            "-y", 
            "-f", "concat",
            "-safe", "0",
            "-i", list_file_path,
            "-vsync", "vfr",
            "-pix_fmt", "yuv420p",
            output_file
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
        print(f"Video created successfully: {output_file}")

    except subprocess.CalledProcessError as e:
        print(f"Error creating video: {e}")
    finally:
        
        if os.path.exists(list_file_path):
            os.remove(list_file_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert webp images to video using ffmpeg.")
    parser.add_argument("--input", required=True, help="Input directory containing .webp images")
    parser.add_argument("--output", required=True, help="Output video file path")
    parser.add_argument("--fps", type=float, default=1.0, help="Frames per second")

    args = parser.parse_args()

    create_video_from_images(args.input, args.output, args.fps)
