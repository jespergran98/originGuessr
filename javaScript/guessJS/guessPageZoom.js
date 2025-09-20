/**
 * Improved Image Zoom and Pan
 * Works with actual rendered image dimensions and clipping elements
 */

class ArtifactZoom {
    constructor() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartTranslateX = 0;
        this.dragStartTranslateY = 0;
        
        this.imageWrapper = null;
        this.image = null;
        this.clipElement = null;
        
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => this.setup());
        document.addEventListener('artifactLoaded', () => setTimeout(() => this.setup(), 500));
        if (document.readyState !== 'loading') this.setup();
    }
    
    setup() {
        this.imageWrapper = document.querySelector('.image-wrapper');
        if (!this.imageWrapper) {
            setTimeout(() => this.setup(), 100);
            return;
        }
        
        // First try to find the image directly in wrapper (fallback)
        this.image = this.imageWrapper.querySelector('img');
        if (!this.image) {
            setTimeout(() => this.setup(), 100);
            return;
        }
        
        // Try to find the clipping element created by artifactRandomizer
        this.clipElement = this.imageWrapper.querySelector('div[style*="border-radius"]');
        
        // If we have a clipping element, get the image from there instead
        if (this.clipElement) {
            const clipImage = this.clipElement.querySelector('img');
            if (clipImage) {
                this.image = clipImage;
                console.log('Using clipped image setup');
            }
        } else {
            console.log('Using direct image setup (no clipping element found)');
        }
        
        this.addStyles();
        this.addEventListeners();
        this.reset();
        
        console.log('Zoom setup complete:', {
            hasWrapper: !!this.imageWrapper,
            hasImage: !!this.image,
            hasClipElement: !!this.clipElement,
            imageSize: this.image ? `${this.image.naturalWidth}x${this.image.naturalHeight}` : 'unknown'
        });
    }
    
    addStyles() {
        if (document.getElementById('zoom-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'zoom-styles';
        style.textContent = `
            .image-wrapper {
                overflow: hidden !important;
                cursor: zoom-in;
            }
            .image-wrapper.can-pan { cursor: grab; }
            .image-wrapper.is-panning { cursor: grabbing; }
        `;
        document.head.appendChild(style);
    }
    
    addEventListeners() {
        // Zoom with mouse wheel
        this.imageWrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Use clip element if available, otherwise use wrapper
            const targetElement = this.clipElement || this.imageWrapper;
            const rect = targetElement.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            if (e.deltaY < 0) {
                this.zoomIn(mouseX, mouseY);
            } else {
                this.zoomOut();
            }
        });
        
        // Start panning
        this.imageWrapper.addEventListener('mousedown', (e) => {
            if (this.scale <= 1) return;
            
            e.preventDefault();
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragStartTranslateX = this.translateX;
            this.dragStartTranslateY = this.translateY;
            
            this.imageWrapper.classList.add('is-panning');
        });
        
        // Pan
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;
            
            this.translateX = this.dragStartTranslateX + deltaX;
            this.translateY = this.dragStartTranslateY + deltaY;
            
            this.constrain();
            this.updateTransform();
        });
        
        // Stop panning
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.imageWrapper.classList.remove('is-panning');
                this.updateCursor();
            }
        });
        
        // Reset on double click
        this.imageWrapper.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.reset();
        });
        
        // Prevent context menu when zoomed
        this.imageWrapper.addEventListener('contextmenu', (e) => {
            if (this.scale > 1) e.preventDefault();
        });
    }
    
    zoomIn(mouseX, mouseY) {
        const oldScale = this.scale;
        this.scale = Math.min(4, this.scale * 1.3);
        
        if (this.scale === oldScale) return;
        
        // Get the dimensions of the zoom target (clip element or wrapper)
        const targetElement = this.clipElement || this.imageWrapper;
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const offsetX = mouseX - centerX;
        const offsetY = mouseY - centerY;
        
        this.translateX = offsetX - (offsetX - this.translateX) * (this.scale / oldScale);
        this.translateY = offsetY - (offsetY - this.translateY) * (this.scale / oldScale);
        
        this.constrain();
        this.updateTransform();
        this.updateCursor();
    }
    
    zoomOut() {
        this.scale = Math.max(1, this.scale / 1.3);
        
        if (this.scale <= 1) {
            this.scale = 1;
            this.translateX = 0;
            this.translateY = 0;
        } else {
            this.constrain();
        }
        
        this.updateTransform();
        this.updateCursor();
    }
    
    constrain() {
        if (this.scale <= 1) {
            this.translateX = 0;
            this.translateY = 0;
            return;
        }
        
        let imageWidth, imageHeight;
        
        if (this.clipElement) {
            // Use clipping element dimensions (actual rendered image size)
            const clipRect = this.clipElement.getBoundingClientRect();
            imageWidth = clipRect.width;
            imageHeight = clipRect.height;
        } else {
            // Fallback: calculate rendered size from natural dimensions
            const wrapperRect = this.imageWrapper.getBoundingClientRect();
            const naturalWidth = this.image.naturalWidth;
            const naturalHeight = this.image.naturalHeight;
            
            if (!naturalWidth || !naturalHeight) return;
            
            const wrapperAspect = wrapperRect.width / wrapperRect.height;
            const imageAspect = naturalWidth / naturalHeight;
            
            if (imageAspect > wrapperAspect) {
                imageWidth = wrapperRect.width;
                imageHeight = wrapperRect.width / imageAspect;
            } else {
                imageHeight = wrapperRect.height;
                imageWidth = wrapperRect.height * imageAspect;
            }
        }
        
        if (!imageWidth || !imageHeight) return;
        
        // Calculate scaled dimensions
        const scaledWidth = imageWidth * this.scale;
        const scaledHeight = imageHeight * this.scale;
        
        // Calculate pan limits
        const maxTranslateX = (scaledWidth - imageWidth) / 2;
        const maxTranslateY = (scaledHeight - imageHeight) / 2;
        
        // Apply constraints
        this.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, this.translateX));
        this.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, this.translateY));
        
        console.log('Pan constraints:', {
            imageSize: `${imageWidth.toFixed(1)}x${imageHeight.toFixed(1)}`,
            scaledSize: `${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}`,
            maxTranslate: `${maxTranslateX.toFixed(1)}, ${maxTranslateY.toFixed(1)}`,
            actualTranslate: `${this.translateX.toFixed(1)}, ${this.translateY.toFixed(1)}`,
            scale: this.scale.toFixed(2)
        });
    }
    
    updateTransform() {
        if (!this.image) return;
        
        this.image.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        this.image.style.transformOrigin = 'center center';
        
        if (this.isDragging) {
            this.image.style.transition = 'none';
        } else {
            this.image.style.transition = 'transform 0.2s ease-out';
        }
    }
    
    updateCursor() {
        this.imageWrapper.classList.remove('can-pan');
        
        if (this.scale > 1) {
            this.imageWrapper.classList.add('can-pan');
        }
    }
    
    reset() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
        this.updateCursor();
    }
}

// Initialize
window.artifactZoom = new ArtifactZoom();