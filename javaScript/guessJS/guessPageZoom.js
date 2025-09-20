/**
 * Fixed Artifact Image Zoom Functionality
 * Mouse wheel to zoom, drag to pan, double-click to reset
 * Fixed panning constraints to prevent image from moving too far
 */

class ArtifactZoom {
    constructor() {
        this.zoomLevel = 1;
        this.minZoom = 1;
        this.maxZoom = 4;
        this.zoomStep = 0.3;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.imageWrapper = null;
        this.originalImageWidth = 0;
        this.originalImageHeight = 0;
        
        this.init();
    }
    
    init() {
        document.addEventListener('artifactLoaded', () => {
            this.setupZoom();
        });
        this.setupZoom();
    }
    
    setupZoom() {
        this.imageWrapper = document.querySelector('.image-wrapper');
        
        if (!this.imageWrapper) {
            setTimeout(() => this.setupZoom(), 100);
            return;
        }
        
        // Wait for image to load and get original dimensions
        const image = this.imageWrapper.querySelector('img');
        if (image && image.complete) {
            this.storeOriginalDimensions();
        } else if (image) {
            image.addEventListener('load', () => {
                this.storeOriginalDimensions();
            });
        }
        
        this.resetZoom();
        this.addStyles();
        this.addEventListeners();
    }
    
    storeOriginalDimensions() {
        const image = this.imageWrapper.querySelector('img');
        if (image) {
            // Store the rendered size of the image (after CSS like object-fit: contain)
            const rect = image.getBoundingClientRect();
            this.originalImageWidth = rect.width;
            this.originalImageHeight = rect.height;
        }
    }
    
    addStyles() {
        if (document.querySelector('#zoom-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'zoom-styles';
        style.textContent = `
            .image-wrapper {
                cursor: zoom-in;
                overflow: hidden;
            }
            
            .image-wrapper.zoomed {
                cursor: grab;
            }
            
            .image-wrapper.dragging {
                cursor: grabbing;
            }
            
            .image-wrapper img {
                display: block;
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
        `;
        document.head.appendChild(style);
    }
    
    addEventListeners() {
        if (!this.imageWrapper) return;
        
        // Mouse wheel zoom
        this.imageWrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? -1 : 1;
            const rect = this.imageWrapper.getBoundingClientRect();
            const centerX = e.clientX - rect.left;
            const centerY = e.clientY - rect.top;
            
            if (delta > 0) {
                this.zoomIn(centerX, centerY);
            } else {
                this.zoomOut();
            }
        });
        
        // Double click to reset
        this.imageWrapper.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.resetZoom();
        });
        
        // Mouse drag for panning
        this.imageWrapper.addEventListener('mousedown', (e) => {
            if (this.zoomLevel <= this.minZoom) return;
            
            e.preventDefault();
            this.isDragging = true;
            this.startX = e.clientX - this.translateX;
            this.startY = e.clientY - this.translateY;
            this.updateCursor();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            this.translateX = e.clientX - this.startX;
            this.translateY = e.clientY - this.startY;
            
            this.constrainPanning();
            this.applyTransform();
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.updateCursor();
            }
        });
        
        this.updateCursor();
    }
    
    zoomIn(centerX, centerY) {
        if (this.zoomLevel >= this.maxZoom) return;
        
        const oldZoom = this.zoomLevel;
        this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
        
        // Zoom towards cursor position
        const zoomRatio = this.zoomLevel / oldZoom;
        const rect = this.imageWrapper.getBoundingClientRect();
        const centerXRel = centerX - rect.width / 2;
        const centerYRel = centerY - rect.height / 2;
        
        this.translateX = centerXRel - (centerXRel - this.translateX) * zoomRatio;
        this.translateY = centerYRel - (centerYRel - this.translateY) * zoomRatio;
        
        this.constrainPanning();
        this.applyTransform();
        this.updateCursor();
    }
    
    zoomOut() {
        if (this.zoomLevel <= this.minZoom) return;
        
        this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
        
        if (this.zoomLevel === this.minZoom) {
            this.translateX = 0;
            this.translateY = 0;
        }
        
        this.constrainPanning();
        this.applyTransform();
        this.updateCursor();
    }
    
    resetZoom() {
        this.zoomLevel = this.minZoom;
        this.translateX = 0;
        this.translateY = 0;
        this.applyTransform();
        this.updateCursor();
    }
    
    constrainPanning() {
        if (this.zoomLevel <= this.minZoom) {
            this.translateX = 0;
            this.translateY = 0;
            return;
        }
        
        // If we don't have original dimensions yet, try to get them
        if (this.originalImageWidth === 0 || this.originalImageHeight === 0) {
            this.storeOriginalDimensions();
            if (this.originalImageWidth === 0 || this.originalImageHeight === 0) {
                return; // Can't constrain without knowing image size
            }
        }
        
        const containerRect = this.imageWrapper.getBoundingClientRect();
        
        // Calculate scaled dimensions
        const scaledWidth = this.originalImageWidth * this.zoomLevel;
        const scaledHeight = this.originalImageHeight * this.zoomLevel;
        
        // Calculate maximum translation IN UNSCALED COORDINATES
        // Since CSS transform applies translate() BEFORE scale(), we need to think in original image coordinates
        if (scaledWidth > containerRect.width) {
            // Maximum distance we can move the center of the image from container center
            const maxOffset = (scaledWidth - containerRect.width) / 2;
            // Convert back to unscaled coordinates by dividing by zoom level
            const maxTranslateX = maxOffset / this.zoomLevel;
            this.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, this.translateX));
        } else {
            this.translateX = 0;
        }
        
        if (scaledHeight > containerRect.height) {
            const maxOffset = (scaledHeight - containerRect.height) / 2;
            const maxTranslateY = maxOffset / this.zoomLevel;
            this.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, this.translateY));
        } else {
            this.translateY = 0;
        }
    }
    
    applyTransform() {
        const image = this.imageWrapper.querySelector('img');
        if (image) {
            image.style.transform = `scale(${this.zoomLevel}) translate(${this.translateX}px, ${this.translateY}px)`;
            image.style.transformOrigin = 'center';
            image.style.transition = this.isDragging ? 'none' : 'transform 0.2s ease';
        }
    }
    
    updateCursor() {
        if (!this.imageWrapper) return;
        
        this.imageWrapper.classList.remove('zoomed', 'dragging');
        
        if (this.isDragging) {
            this.imageWrapper.classList.add('dragging');
        } else if (this.zoomLevel > this.minZoom) {
            this.imageWrapper.classList.add('zoomed');
        }
    }
}

// Initialize zoom functionality
document.addEventListener('DOMContentLoaded', function() {
    window.artifactZoom = new ArtifactZoom();
});

if (document.readyState !== 'loading') {
    window.artifactZoom = new ArtifactZoom();
}