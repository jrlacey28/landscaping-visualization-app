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
    // Check both planId and status to determine if it's a paid plan
    const hasPaidPlan = subscription && 
      subscription.status === 'active' && 
      subscription.planId && 
      subscription.planId !== 'free' &&
      subscription.planId !== '' &&
      subscription.planId !== null;
    
    if (!hasPaidPlan) {
      // Add watermark for free users
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      
      logo.onload = function () {
        // Watermark for free users (4% of image width - much smaller, no background)
        const logoWidth = img.width * 0.04;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        
        // Position in upper left corner with padding
        const padding = 15;
        const x = padding;
        const y = padding;
        
        // Draw logo (no background box)
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
        
        // Add "DreamBuilder" text next to logo using Segoe UI font (no shadow to avoid dark box)
        const fontSize = logoWidth * 0.35;
        ctx.font = `bold ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText("DreamBuilder", x + logoWidth + 5, y + logoHeight / 2 + fontSize / 3);
        
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