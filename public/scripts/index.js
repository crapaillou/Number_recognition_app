const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;

function drawOnCanvas() {
    let isDrawing = false;

    ctx.lineWidth = 9; // Set the default line width
    ctx.strokeStyle = 'black'; // Set default stroke color
    ctx.lineCap = 'round';
    
    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      ctx.beginPath();
      ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDrawing) {
        ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
        ctx.stroke();
      }
    });

    canvas.addEventListener('mouseup', () => {
      isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
      isDrawing = false;
    });
  }

//function to clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function findBoundingBox() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let x = 0;
    let y = 0;
    // Iterate through the pixel data to find the bounding box of the drawn content
    for (let i = 0; i < data.length; i += 1) {
      let alpha = data[i]; // Check alpha channel to see if pixel is drawn
  
      if (alpha > 0) {
        
        x = (i / 4) % canvas.width;
        y = Math.floor(i / 4 / canvas.height);
  
        // Update bounding box coordinates
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  
    // Calculate width and height of the bounding box
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Return bounding box coordinates and dimensions
    minX = Math.floor(minX)
    minY = Math.floor(minY)
    maxX = Math.floor(maxX)
    maxY = Math.floor(maxY)
    console.log({ minX, minY, maxX, maxY, width, height });
    return { minX, minY, width, height };
  }
  
function gravity_center(){
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let sumX = 0;
    let sumY = 0;
    let totalAlphaWeight = 0;
    let weight = 0;
    let x = 0;
    let y = 0;
    
    for (let i = 3; i < data.length; i += 4){
      
    // Calculate weight (considering alpha value)
    weight = data[i]/255
      
    // Calculate coordinates of the pixel
      
    x = (i / 4) % canvas.width;
    y = Math.floor((i / 4) / canvas.width);
      
    // Accumulate weighted sum of coordinates
      
    sumX += x * weight;
    sumY += y * weight;
  
    // Accumulate total alpha weight
    totalAlphaWeight += weight;
      
    }
    // Calculate center of gravity
    
    const centerX = sumX / totalAlphaWeight;
    const centerY = sumY / totalAlphaWeight;
  
    console.log({ x: centerX, y: centerY });
    return { x: centerX, y: centerY }
}

function cropImageData(boundingBox, originalImageData) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const { minX, minY, width, height } = boundingBox;
    const croppedData = [];
    console.log(data)

    for (let y = minY; y < minY + height; y++) {
        for (let x = minX; x < minX + width; x++) {
        const index = (y * imageData.width + x) * 4;
        croppedData.push(
            data[index],
            data[index + 1],
            data[index + 2],
            data[index + 3]
      );
    }
  }

  // Create a new ImageData object for the cropped data
  console.log(croppedData)
  return croppedData;
}

function alpha_filter(unfilter){
  let a_filter = [];
  for (let i = 3; i < unfilter.length; i += 4){
  a_filter.push(unfilter[i]);
  }
  return a_filter;
}

function image_process(){
    gravity_center()
    const bbx = findBoundingBox()
    const cropData = cropImageData(bbx)
    const a_filter = alpha_filter(cropData)
    let imageObj = {
      width : bbx.width,
      height : bbx.height,
      data : a_filter
    };
    console.log("sendData",imageObj)
    sendCroppedImageToServer(imageObj)
}

async function sendCroppedImageToServer(croppedImageData) {
    try {
      
      const serverURL = 'http://127.0.0.1:3000/process_image';
  
      const response = await fetch(serverURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({ imageData: croppedImageData }), // Sending the cropped image data
      });
  
      if (response.ok) {
        // Extracting the response content as text
        const responseData = await response.text();
        document.getElementById('serverResponse').innerText = responseData;
        console.log('Image data sent successfully!');
      } else {
        console.error('Failed to send image data:', response.status);
      }
    } catch (error) {
      console.error('Error sending image data:', error);
    }
  }

  drawOnCanvas();
