import Gallery from "@/components/Gallery";

export default function GalleryPage() {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Gallery</h1>
                <p className="page-description">Browse all your captured screenshots</p>
            </div>
            <Gallery />
        </div>
    );
}
