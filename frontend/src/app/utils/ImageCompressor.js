const blobToFile = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        const img = new Image();
  
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
  
          // Set maximum dimensions
          const maxWidth = 2880;
          const maxHeight = 1620;
  
          // Calculate new dimensions while preserving aspect ratio
          let newWidth = img.width;
          let newHeight = img.height;
  
          if (newWidth > maxWidth) {
            newHeight *= maxWidth / newWidth;
            newWidth = maxWidth;
          }
  
          if (newHeight > maxHeight) {
            newWidth *= maxHeight / newHeight;
            newHeight = maxHeight;
          }
  
          // Set canvas dimensions
          canvas.width = newWidth;
          canvas.height = newHeight;
  
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
  
          // Get compressed image as data URL with desired quality
          const compressedDataURL = canvas.toDataURL('image/jpeg', 0.6); // Adjust quality as needed
  
          // Convert data URL to Blob
          const byteString = atob(compressedDataURL.split(',')[1]);
          const mimeString = compressedDataURL.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
  
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
  
          const compressedBlob = new Blob([ab], { type: mimeString });
  
          // Log original and compressed file size
          // console.log('Original file size:', blob.size, 'bytes');
          // console.log('Compressed file size:', compressedBlob.size, 'bytes');
  
          // Generate a unique filename using a timestamp
          const timestamp = new Date().getTime();
          const fileName = `image_${timestamp}.jpg`;
  
          // Create a new File object
          const file = new File([compressedBlob], fileName, { type: mimeString });
  
          resolve(file);
        };
  
        img.src = reader.result;
      };
  
      reader.onerror = (error) => {
        reject(new Error("Error reading the Blob:", error));
      };
  
      reader.readAsDataURL(blob);
    });
  };

  export default blobToFile;