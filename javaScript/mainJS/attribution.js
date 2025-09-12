// Attribution display and link management
function updateAttribution(artifact) {
    const attributionElement = document.getElementById('attribution-text');
    
    if (!attributionElement) return;
    
    let attributionHTML = '';
    
    // Check if author is Public Domain (case insensitive)
    const isPublicDomain = artifact.author && artifact.author.toLowerCase().replace(/\s+/g, '') === 'publicdomain';
    
    if (isPublicDomain) {
        // Show Public Domain with copyright-free symbol (C with diagonal line through it)
        attributionHTML = 'Public Domain <span style="position: relative; display: inline-block;">©<span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg); width: 0.6em; height: 1px; background: currentColor;"></span></span>';
    } else {
        // Add author link if available and not public domain
        if (artifact.author) {
            if (artifact.authorLink) {
                attributionHTML += `<a href="${artifact.authorLink}" target="_blank" rel="noopener">${artifact.author}</a>`;
            } else {
                attributionHTML += artifact.author;
            }
        }
        
        // Add separator if both author and license exist
        if (attributionHTML && artifact.license) {
            attributionHTML += ' / ';
        }
        
        // Add license link
        if (artifact.license) {
            const licenseUrl = getLicenseUrl(artifact.license);
            if (licenseUrl) {
                attributionHTML += `<a href="${licenseUrl}" target="_blank" rel="noopener">${artifact.license}</a>`;
            } else {
                attributionHTML += artifact.license;
            }
        }
    }
    
    attributionElement.innerHTML = attributionHTML;
}

// Convert license names to Creative Commons URLs
function getLicenseUrl(license) {
    const licenseMap = {
        'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0',
        'CC BY 2.5': 'https://creativecommons.org/licenses/by/2.5',
        'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0',
        'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0',
        'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0'
    };
    
    return licenseMap[license] || null;
}