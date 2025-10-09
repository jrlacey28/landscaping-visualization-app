import type { User } from "@shared/schema";

interface DownloadImageOptions {
  imageUrl: string;
  fileName: string;
  user: User | null;
  subscription?: any;
}

export async function downloadImageWithWatermark({
  imageUrl,
  fileName,
  user,
  subscription
}: DownloadImageOptions): Promise<void> {
  const img = document.createElement("img");
  img.crossOrigin = "anonymous";
  
  img.onload = async function () {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the original image
    ctx.drawImage(img, 0, 0);
    
    // Check if user has a paid subscription (Contractor, Business Pro, or Enterprise)
    const hasPaidPlan = subscription && 
      subscription.status === 'active' && 
      subscription.planId !== 'free';
    
    if (!hasPaidPlan) {
      // Add watermark for free users
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      
      logo.onload = function () {
        // Watermark for free users (15% of image width)
        const logoWidth = img.width * 0.15;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        
        // Position in upper left corner with padding
        const padding = 20;
        const x = padding;
        const y = padding;
        
        // Add semi-transparent background
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(x - 10, y - 10, logoWidth + 20, logoHeight + 40);
        
        // Draw logo
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
        
        // Add "DreamBuilder AI" text below logo
        ctx.font = `bold ${logoWidth * 0.12}px Arial`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("DreamBuilder AI", x + logoWidth / 2, y + logoHeight + 20);
        
        // Download the image
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = fileName;
              a.click();
              URL.revokeObjectURL(url);
            }
          },
          "image/jpeg",
          0.9
        );
      };
      
      logo.src = "/dreambuilder-logo.png";
    } else {
      // No watermark for paid users
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };
  
  img.src = imageUrl;
}