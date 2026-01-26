import { Suspense } from "react";
import Gallery from "@/components/Gallery";

function GalleryLoading() {
    return (
        <div className="loading">
            <div className="loading-spinner" />
        </div>
    );
}

export default function GalleryPage() {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Gallery</h1>
                <p className="page-description">Browse all your captured screenshots</p>
            </div>
            <Suspense fallback={<GalleryLoading />}>
                <Gallery />
            </Suspense>
        </div>
    );
}
