ImageFilters.js
======

An image filters library for the HTML5 canvas tag.

### Usage ###

include the library into your html.
	<script type="text/javascript" src="imagefilters.js"></script>

Each filter will take an ImageData as the first parameter
and always return a modified copy. Below is a basic example.

	<script type="text/javascript">
	  var canvas = document.getElementById('canvas_id');
	  var ctx = canvas.getContext('2d');
	  
	  // do some drawing to your context...
	  
	  // create an ImageData for the area you want to apply the filter.
	  var imageData = ctx.getImageData(0, 0, 300, 200);
	  
	  // pass it to a filter and get the modified copy
	  var filterd = ImageFilters.GrayScale(imageData);
	  
	  // put it back into a context to view the results
	  ctx.putImageData(filterd, 0, 0);
	</script>

check out the Examples section for more details.


### Examples ###

Basic usage (view source)
<http://www.arahaya.com/imagefilters/usage1/>

API demos
<http://www.arahaya.com/imagefilters/>

Ripple effect demo
<http://www.arahaya.com/imagefilters/ripple/>


### Tested Browsers ###
Opera 10.50
Chrome 11.0.696.68 
Firefox 3.5.4 
IE 9


### API List ###
ImageFilters.ConvolutionFilter (srcImageData, matrixX, matrixY, matrix, divisor, bias, preserveAlpha, clamp, color, alpha)
ImageFilters.Binarize (srcImageData, threshold)
ImageFilters.BasicBlur (srcImageData)
ImageFilters.blendAdd (srcImageData, blendImageData, dx, dy)
ImageFilters.blendSubtract (srcImageData, blendImageData, dx, dy)
ImageFilters.BoxBlur (srcImageData, hRadius, vRadius, quality)
ImageFilters.GaussianBlur (srcImageData, strength)
ImageFilters.Brightness (srcImageData, brightness)
ImageFilters.BrightnessContrastGimp (srcImageData, brightness, contrast)
ImageFilters.BrightnessContrastPhotoshop (srcImageData, brightness, contrast)
ImageFilters.Channels (srcImageData, channel)
ImageFilters.Clone (srcImageData)
ImageFilters.ColorMatrixFilter (srcImageData, matrix)
ImageFilters.ColorTransformFilter (
ImageFilters.Copy (srcImageData, dstImageData)
ImageFilters.Crop (srcImageData, x, y, width, height)
ImageFilters.Desaturate (srcImageData)
ImageFilters.DisplacementMapFilter (srcImageData, mapImageData, mapX, mapY, componentX, componentY, scaleX, scaleY, mode)
ImageFilters.Edge (srcImageData)
ImageFilters.Emboss (srcImageData)
ImageFilters.Flip (srcImageData, vertical)
ImageFilters.Gamma (srcImageData, gamma)
ImageFilters.GrayScale (srcImageData)
ImageFilters.HSLAdjustment (srcImageData, hueDelta, satDelta, lightness)
ImageFilters.Invert (srcImageData)
ImageFilters.Mosaic (srcImageData, blockSize)
ImageFilters.OpacityFilter (srcImageData, opacity)
ImageFilters.Posterize (srcImageData, levels)
ImageFilters.Rescale (srcImageData, scale)
ImageFilters.Resize (srcImageData, width, height)
ImageFilters.ResizeNearestNeighbor (srcImageData, width, height)
ImageFilters.Sepia srcImageData)
ImageFilters.Sharpen (srcImageData, factor)
ImageFilters.Solarize (srcImageData)
ImageFilters.Twril (srcImageData, centerX, centerY, radius, angle, edge, smooth)


