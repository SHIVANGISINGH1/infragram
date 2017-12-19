// Generated by CoffeeScript 2.1.0
// This file was adapted from infragram-js:
// http://github.com/p-v-o-s/infragram-js.
module.exports = function webglProcessor() {

  var imgContext = null,
      mapContext = null,
      vertices = [-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0],
      waitForShadersToLoad = 0;

  vertices.itemSize = 2;

  function initialize() {
    imgContext = createContext("raw", 1, 0, 1.0, "image");
    mapContext = createContext("raw", 1, 1, 1.0, "colorbar");
    waitForShadersToLoad = 2;
    $("#shader-vs").load("dist/shader.vert", glShaderLoaded);
    $("#shader-fs-template").load("dist/shader.frag", glShaderLoaded);
    if (imgContext && mapContext) {
      return true;
    } else {
      return false;
    }
  };

  function createBuffer(ctx, data) {
    var buffer, gl;
    gl = ctx.gl;
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffer.itemSize = data.itemSize;
    return buffer;
  };

  function createTexture(ctx, textureUnit) {
    var gl, texture;
    gl = ctx.gl;
    texture = gl.createTexture();
    gl.activeTexture(textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ctx.canvas.width, ctx.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return texture;
  };

  createContext = function(mode, selColormap, colormap, slider, canvasName) {
    var ctx;
    ctx = new Object();
    ctx.mode = mode;
    ctx.expression = ["", "", ""];
    ctx.selColormap = selColormap;
    ctx.colormap = colormap;
    ctx.slider = slider;
    ctx.updateShader = true;
    ctx.canvas = document.getElementById(canvasName);
    ctx.canvas.addEventListener("webglcontextlost", (function(event) {
      return event.preventDefault();
    }), false);
    ctx.canvas.addEventListener("webglcontextrestored", glRestoreContext, false);
    require('../util/webgl-utils');
    ctx.gl = getWebGLContext(ctx.canvas);
    if (ctx.gl) {
      ctx.gl.getExtension("OES_texture_float");
      ctx.vertexBuffer = createBuffer(ctx, vertices);
      ctx.framebuffer = ctx.gl.createFramebuffer();
      ctx.imageTexture = createTexture(ctx, ctx.gl.TEXTURE0);
      return ctx;
    } else {
      return null;
    }
  };

  function drawScene(ctx, returnImage) {
    var gl, pColormap, pHsvUniform, pNdviUniform, pSampler, pSelColormapUniform, pSliderUniform, pVertexPosition;
    if (!returnImage) {
      requestAnimFrame(function() {
        return drawScene(ctx, false);
      });
    }
    if (ctx.updateShader) {
      ctx.updateShader = false;
      generateShader(ctx);
    }
    gl = ctx.gl;
    gl.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
    gl.useProgram(ctx.shaderProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.vertexBuffer);
    pVertexPosition = gl.getAttribLocation(ctx.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(pVertexPosition);
    gl.vertexAttribPointer(pVertexPosition, ctx.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    pSampler = gl.getUniformLocation(ctx.shaderProgram, "uSampler");
    gl.uniform1i(pSampler, 0);
    pSliderUniform = gl.getUniformLocation(ctx.shaderProgram, "uSlider");
    gl.uniform1f(pSliderUniform, ctx.slider);
    pNdviUniform = gl.getUniformLocation(ctx.shaderProgram, "uNdvi");
    gl.uniform1i(pNdviUniform, (ctx.mode === "ndvi" || ctx.colormap ? 1 : 0));
    pSelColormapUniform = gl.getUniformLocation(ctx.shaderProgram, "uSelectColormap");
    gl.uniform1i(pSelColormapUniform, ctx.selColormap);
    pHsvUniform = gl.getUniformLocation(ctx.shaderProgram, "uHsv");
    gl.uniform1i(pHsvUniform, (ctx.mode === "hsv" ? 1 : 0));
    pColormap = gl.getUniformLocation(ctx.shaderProgram, "uColormap");
    gl.uniform1i(pColormap, (ctx.colormap ? 1 : 0));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / vertices.itemSize);
    if (returnImage) {
      return ctx.canvas.toDataURL("image/jpeg");
    }
  };

  function generateShader(ctx) {
    var b, code, g, r;
    [r, g, b] = ctx.expression;
    // Map HSV to shader variable names
    r = r.toLowerCase().replace(/h/g, "r").replace(/s/g, "g").replace(/v/g, "b");
    g = g.toLowerCase().replace(/h/g, "r").replace(/s/g, "g").replace(/v/g, "b");
    b = b.toLowerCase().replace(/h/g, "r").replace(/s/g, "g").replace(/v/g, "b");
    // Sanitize strings
    r = r.replace(/[^xrgb\/\-\+\*\(\)\.0-9]*/g, "");
    g = g.replace(/[^xrgb\/\-\+\*\(\)\.0-9]*/g, "");
    b = b.replace(/[^xrgb\/\-\+\*\(\)\.0-9]*/g, "");
    // Convert int to float
    r = r.replace(/([0-9])([^\.])?/g, "$1.0$2");
    g = g.replace(/([0-9])([^\.])?/g, "$1.0$2");
    b = b.replace(/([0-9])([^\.])?/g, "$1.0$2");
    if (ctx.mode === "ndvi") {
      if (r !== "") {
        r = "((" + r + ") + 1.0) / 2.0";
      }
      if (g !== "") {
        g = "((" + g + ") + 1.0) / 2.0";
      }
      if (b !== "") {
        b = "((" + b + ") + 1.0) / 2.0";
      }
    }
    if (r === "") {
      r = "r";
    }
    if (g === "") {
      g = "g";
    }
    if (b === "") {
      b = "b";
    }
    code = $("#shader-fs-template").html();
    code = code.replace(/@1@/g, r);
    code = code.replace(/@2@/g, g);
    code = code.replace(/@3@/g, b);
    $("#shader-fs").html(code);
    return ctx.shaderProgram = createProgramFromScripts(ctx.gl, ["shader-vs", "shader-fs"]);
  };

  function setMode(ctx, newMode) {
    ctx.mode = newMode;
    ctx.updateShader = true;
    if (ctx.mode === "ndvi") {
      $("#colorbar-container")[0].style.display = "inline-block";
      return $("#colormaps-group")[0].style.display = "inline-block";
    } else {
      $("#colorbar-container")[0].style.display = "none";
      return $("#colormaps-group")[0].style.display = "none";
    }
  };

  function glShaderLoaded() {
    waitForShadersToLoad -= 1;
    if (!waitForShadersToLoad) {
      drawScene(imgContext);
      return drawScene(mapContext);
    }
  };

  function glRestoreContext() {
    var imageData;
    imageData = imgContext.imageData;
    imgContext = createContext(imgContext.mode, imgContext.selColormap, imgContext.colormap, imgContext.slider, "image");
    mapContext = createContext(mapContext.mode, mapContext.selColormap, mapContext.colormap, mapContext.slider, "colorbar");
    if (imgContext && mapContext) {
      return glUpdateImage(imageData);
    }
  };

  function updateImage(img) {
    var gl;
    gl = imgContext.gl;
    imgContext.imageData = img;
    gl.activeTexture(gl.TEXTURE0);
    return gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  };

  function getCurrentImage() {
    return drawScene(imgContext, true);
  };

  function glHandleDefaultColormap() {
    return imgContext.selColormap = mapContext.selColormap = 0;
  };

  function glHandleStretchedColormap() {
    return imgContext.selColormap = mapContext.selColormap = 2;
  };

  function saveExpression(a, b, c) {
    return imgContext.expression = [a, b, c];
  };

  function runInfragrammar(mode) {
    return setMode(imgContext, "ndvi");
  };

  function glHandleOnClickRaw() {
    return glSetMode(imgContext, "raw");
  };

  function glHandleOnClickNdvi() {
    return glSetMode(imgContext, "ndvi");
  };

  function glHandleOnSubmitInfraHsv() {
    return glSetMode(imgContext, "hsv");
  };

  function glHandleOnSubmitInfra() {
    return glSetMode(imgContext, "rgb");
  };

  function glHandleOnSubmitInfraMono() {
    return glSetMode(imgContext, "mono");
  };

  function glHandleOnClickGrey() {
    return imgContext.selColormap = mapContext.selColormap = 1;
  };

  function glHandleOnClickColor() {
    return imgContext.selColormap = mapContext.selColormap = 0;
  };

  function glHandleOnSlide(event) {
    return imgContext.slider = event.value / 100.0;
  };

  return {
    initialize: initialize,
    getCurrentImage: getCurrentImage,
    runInfragrammar: runInfragrammar,
    save_expressions: saveExpression,
    setMode: setMode,
    updateImage: updateImage
  }

}
