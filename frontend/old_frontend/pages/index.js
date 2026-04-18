import { useState } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function setClientToken(token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("token", token);

  const isHttps = window.location.protocol === "https:";
  document.cookie = [
    `token=${encodeURIComponent(token)}`,
    "Path=/",
    "Max-Age=86400",
    "SameSite=Lax",
    isHttps ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function fetchApi(path, options = {}) {
  const token = getStoredToken();
  const opts = {
    credentials: "include",
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  };

  return fetch(`${BASE_URL}${path}`, opts).then(async (res) => {
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(body?.message || `${res.status} ${res.statusText}`);
    }
    return body;
  });
}

export default function Home() {
  const [status, setStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [imageData, setImageData] = useState({ uploadId: "", publicId: "" });
  const [imageList, setImageList] = useState([]);
  const [imageStatus, setImageStatus] = useState(null);
  const [foundImage, setFoundImage] = useState(null);

  const sliderFields = [
    { key: "brightness", label: "Brightness", min: -100, max: 100, step: 1 },
    { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
    { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
    { key: "hue", label: "Hue", min: -180, max: 180, step: 1 },
    { key: "vibrance", label: "Vibrance", min: -100, max: 100, step: 1 },
    { key: "gamma", label: "Gamma", min: 0, max: 10, step: 0.1 },
    { key: "sharpen", label: "Sharpen", min: 0, max: 100, step: 1 },
    { key: "unsharpMask", label: "Unsharp Mask", min: 0, max: 100, step: 1 },
    { key: "blur", label: "Blur", min: 0, max: 100, step: 1 },
    { key: "pixelate", label: "Pixelate", min: 0, max: 100, step: 1 },
    { key: "vignette", label: "Vignette", min: 0, max: 100, step: 1 },
    { key: "oilPaint", label: "Oil Paint", min: 0, max: 100, step: 1 },
    { key: "opacity", label: "Watermark Opacity", min: 0, max: 100, step: 1 },
  ];

  const selectOptions = {
    crop: ["fill", "fit", "limit", "pad", "scale", "thumb"],
    gravity: [
      "auto",
      "face",
      "faces",
      "center",
      "north",
      "south",
      "east",
      "west",
      "north_east",
      "north_west",
      "south_east",
      "south_west",
    ],
    flip: ["none", "horizontal", "vertical", "both"],
    format: ["", "jpg", "png", "webp", "avif", "gif", "pdf", "auto"],
    fetchFormat: ["", "auto"],
    watermarkGravity: ["south_east","south_west","north_east","north_west","center","north","south","east","west"],
    radius: ["", "max"],
  };

  const SliderControl = ({ field }) => {
    const enabledKey = `enable${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`;
    return (
      <div className="slider-item">
        <label>
          <input
            type="checkbox"
            name={enabledKey}
            checked={transformConfig[enabledKey]}
            onChange={handleChange(setTransformConfig)}
          />
          {field.label}: {transformConfig[field.key]}
        </label>

        <input
          type="range"
          name={field.key}
          min={field.min}
          max={field.max}
          step={field.step}
          value={transformConfig[field.key]}
          onChange={handleChange(setTransformConfig)}
          disabled={!transformConfig[enabledKey]}
        />
      </div>
    );
  };

  const [transformConfig, setTransformConfig] = useState({
    id: "",
    resizeWidth: "",
    resizeHeight: "",
    resizeCrop: "fill",
    resizeGravity: "auto",
    resizeZoom: "",
    rotate: "",
    flip: "none",
    brightness: "0",
    contrast: "0",
    saturation: "0",
    hue: "0",
    vibrance: "0",
    gamma: "1",
    sharpen: "0",
    unsharpMask: "0",
    grayscale: false,
    sepia: false,
    negate: false,
    blur: "0",
    pixelate: "0",
    vignette: "0",
    oilPaint: "0",
    cartoonify: false,
    cartoonifyAmount: "",
    art: "",
    radius: "",
    borderWidth: "",
    borderColor: "",
    background: "",
    watermarkText: "",
    watermarkFontFamily: "Arial",
    watermarkFontSize: "40",
    watermarkFontColor: "#FFFFFF",
    watermarkGravity: "south_east",
    watermarkX: "10",
    watermarkY: "10",
    watermarkOpacity: "60",
    quality: "",
    dpr: "",
    format: "",
    fetchFormat: "",
    enableBrightness: false,
    enableContrast: false,
    enableSaturation: false,
    enableHue: false,
    enableVibrance: false,
    enableGamma: false,
    enableSharpen: false,
    enableUnsharpMask: false,
    enableBlur: false,
    enablePixelate: false,
    enableVignette: false,
    enableOilPaint: false,
    enableWatermarkOpacity: true,
  });
  const [transformResult, setTransformResult] = useState(null);

  const handleChange = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus("Registering...");
    try {
      const payload = { email: loginData.email, password: loginData.password };
      const result = await fetchApi("/users/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStatus(`Register success: ${JSON.stringify(result.data)}`);
    } catch (err) {
      setStatus(`Register failed: ${err.message}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("Logging in...");
    try {
      const payload = { email: loginData.email, password: loginData.password };
      const result = await fetchApi("/users/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result?.data?.token) {
        setClientToken(result.data.token);
      }

      setStatus(
        `Login success (${result.data.token ? "token returned" : "no token in response"})`,
      );
    } catch (err) {
      setStatus(`Login failed: ${err.message}`);
    }
  };

  const loadProfile = async () => {
    setStatus("Loading profile...");
    try {
      const result = await fetchApi("/users/profile");
      setUser(result.data);
      setStatus("Profile loaded");
    } catch (err) {
      setStatus(`Profile failed: ${err.message}`);
      setUser(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.elements.image.files[0];
    if (!file) {
      setStatus("Pick an image first");
      return;
    }
    setStatus("Uploading image...");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await fetchApi("/images", {
        method: "POST",
        body: formData,
      });
      setImageData({ uploadId: result.data.uploadId, publicId: "" });
      setStatus(`Enqueued upload ID: ${result.data.uploadId}`);
    } catch (err) {
      setStatus(`Upload failed: ${err.message}`);
    }
  };

  const checkUploadStatus = async () => {
    if (!imageData.uploadId) {
      setStatus("No uploadId yet");
      return;
    }
    setStatus("Checking upload status...");
    try {
      const result = await fetchApi(`/images/${imageData.uploadId}/status`);
      setImageStatus(result.data);
      setStatus(`Status: ${result.data.status}`);
      if (result.data.publicId)
        setImageData((prev) => ({ ...prev, publicId: result.data.publicId }));
    } catch (err) {
      setStatus(`Status check failed: ${err.message}`);
    }
  };

  const fetchPublicImage = async () => {
    if (!imageData.publicId) {
      setStatus("No publicId available");
      return;
    }
    setStatus("Fetching image URL...");
    try {
      const result = await fetchApi(
        `/images/get-image?publicId=${imageData.publicId}`,
      );
      setFoundImage(result.data.url);
      setStatus("Got public image URL");
    } catch (err) {
      setStatus(`Fetch failed: ${err.message}`);
      setFoundImage(null);
    }
  };
  const listImages = async () => {
    setStatus("Loading image list...");
    try {
      const result = await fetchApi("/images?page=1&limit=10");
      setImageList(result.data || []);
      setStatus(`Loaded ${result.data.length} images`);
    } catch (err) {
      setStatus(`List failed: ${err.message}`);
      setImageList([]);
    }
  };

  const transformImage = async (e) => {
    e.preventDefault();
    if (!transformConfig.id) {
      setStatus("Set image publicId in transform form");
      return;
    }
    setStatus("Applying transformation...");
    try {
      const transformations = {};

      // Resize
      if (
        transformConfig.resizeWidth ||
        transformConfig.resizeHeight ||
        transformConfig.resizeCrop ||
        transformConfig.resizeGravity ||
        transformConfig.resizeZoom
      ) {
        transformations.resize = {};
        if (transformConfig.resizeWidth)
          transformations.resize.width = Number(transformConfig.resizeWidth);
        if (transformConfig.resizeHeight)
          transformations.resize.height = Number(transformConfig.resizeHeight);
        if (transformConfig.resizeCrop)
          transformations.resize.crop = transformConfig.resizeCrop;
        if (transformConfig.resizeGravity)
          transformations.resize.gravity = transformConfig.resizeGravity;
        if (transformConfig.resizeZoom)
          transformations.resize.zoom = Number(transformConfig.resizeZoom);
      }

      // Rotate
      if (transformConfig.rotate) {
        transformations.rotate = Number(transformConfig.rotate);
      }

      // Flip
      if (transformConfig.flip && transformConfig.flip !== "none") {
        transformations.flip = transformConfig.flip;
      }

      // Adjustments (enable with checkbox)
      const adjustments = {};
      [
        { key: "brightness", enableKey: "enableBrightness" },
        { key: "contrast", enableKey: "enableContrast" },
        { key: "saturation", enableKey: "enableSaturation" },
        { key: "hue", enableKey: "enableHue" },
        { key: "vibrance", enableKey: "enableVibrance" },
        { key: "gamma", enableKey: "enableGamma" },
        { key: "sharpen", enableKey: "enableSharpen" },
        { key: "unsharpMask", enableKey: "enableUnsharpMask" },
      ].forEach(({ key, enableKey }) => {
        if (transformConfig[enableKey]) {
          const value = transformConfig[key];
          if (value !== "" && value !== null && value !== undefined) {
            adjustments[key] = Number(value);
          }
        }
      });
      if (Object.keys(adjustments).length > 0) {
        transformations.adjustments = adjustments;
      }

      // Filters
      const filters = {};
      if (transformConfig.grayscale) filters.grayscale = true;
      if (transformConfig.sepia) filters.sepia = true;
      if (transformConfig.negate) filters.negate = true;
      if (transformConfig.enableBlur && transformConfig.blur !== "") filters.blur = Number(transformConfig.blur);
      if (transformConfig.enablePixelate && transformConfig.pixelate !== "") filters.pixelate = Number(transformConfig.pixelate);
      if (transformConfig.enableVignette && transformConfig.vignette !== "") filters.vignette = Number(transformConfig.vignette);
      if (transformConfig.enableOilPaint && transformConfig.oilPaint !== "") filters.oilPaint = Number(transformConfig.oilPaint);
      if (transformConfig.cartoonify) {
        if (transformConfig.cartoonifyAmount) {
          filters.cartoonify = Number(transformConfig.cartoonifyAmount);
        } else {
          filters.cartoonify = true;
        }
      }
      if (transformConfig.art) filters.art = transformConfig.art;
      if (Object.keys(filters).length > 0) {
        transformations.filters = filters;
      }

      // Radius / border / background / watermark
      if (transformConfig.radius) {
        const r = transformConfig.radius.toLowerCase();
        transformations.radius = r === "max" ? "max" : Number(transformConfig.radius);
      }
      if (transformConfig.borderWidth && transformConfig.borderColor) {
        transformations.border = {
          width: Number(transformConfig.borderWidth),
          color: transformConfig.borderColor,
        };
      }
      if (transformConfig.background) {
        transformations.background = transformConfig.background;
      }
      if (transformConfig.watermarkText) {
        transformations.watermark = {
          text: transformConfig.watermarkText,
          fontFamily: transformConfig.watermarkFontFamily,
          fontSize: Number(transformConfig.watermarkFontSize),
          fontColor: transformConfig.watermarkFontColor,
          gravity: transformConfig.watermarkGravity,
          x: Number(transformConfig.watermarkX),
          y: Number(transformConfig.watermarkY),
          opacity: Number(transformConfig.watermarkOpacity),
        };
      }

      // Quality / dpr / format / fetchFormat
      if (transformConfig.quality) {
        const q = transformConfig.quality.toLowerCase();
        transformations.quality = q === "auto" ? "auto" : Number(transformConfig.quality);
      }
      if (transformConfig.dpr) transformations.dpr = Number(transformConfig.dpr);
      if (transformConfig.format) transformations.format = transformConfig.format;
      if (transformConfig.fetchFormat) transformations.fetchFormat = transformConfig.fetchFormat;

      const body = { transformations };
      console.log("Transform request body:", body);
      const result = await fetchApi(
        `/images/transform?id=${encodeURIComponent(transformConfig.id)}`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      setTransformResult(result.data.url);
      setStatus("Transform executed");
    } catch (err) {
      setStatus(`Transform failed: ${err.message}`);
      setTransformResult(null);
    }
  };

  return (
    <div className="container">
      <h1>Image Processing UI (Next.js)</h1>
      <div className="card">
        <h2>Auth</h2>
        <small>
          All auth routes: /users/register, /users/login, /users/profile
        </small>

        <form onSubmit={handleRegister}>
          <h3>Register</h3>
          <input
            type="email"
            name="email"
            value={loginData.email}
            placeholder="Email"
            onChange={(e) =>
              setLoginData((prev) => ({ ...prev, email: e.target.value }))
            }
            required
          />
          <input
            type="password"
            name="password"
            value={loginData.password}
            placeholder="Password"
            onChange={(e) =>
              setLoginData((prev) => ({ ...prev, password: e.target.value }))
            }
            required
          />
          <button type="submit">Register</button>
        </form>

        <form onSubmit={handleLogin}>
          <h3>Login</h3>
          <button type="submit">Login</button>
        </form>

        <button onClick={loadProfile}>Load Profile</button>
        {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
      </div>

      <div className="card">
        <h2>Images</h2>
        <small>
          Endpoints: POST /images, GET /images/:publicId, GET
          /images/:id/status, GET /images
        </small>

        <form onSubmit={handleUpload}>
          <h3>Upload</h3>
          <input type="file" name="image" accept="image/*" required />
          <button type="submit">Upload</button>
        </form>

        <div>
          <button onClick={checkUploadStatus}>Check Upload Status</button>
          <button onClick={fetchPublicImage}>Fetch Image by PublicId</button>
          <button onClick={listImages}>Load Current User Images</button>
        </div>

        <div>
          <strong>Upload ID:</strong> {imageData.uploadId}
          <br />
          <strong>Public ID:</strong> {imageData.publicId}
        </div>

        {imageStatus && <pre>{JSON.stringify(imageStatus, null, 2)}</pre>}
        {foundImage && (
          <div>
            <p>Public image URL:</p>
            <img
              src={foundImage}
              alt="from cloudinary"
              style={{ maxWidth: "100%", marginTop: 12 }}
            />
            <p>{foundImage}</p>
          </div>
        )}

        <h3>Transform</h3>
        <form onSubmit={transformImage} className="transform-form">
          <div className="row">
            <label>Public ID</label>
            <input
              name="id"
              placeholder="publicId"
              value={transformConfig.id}
              onChange={(e) =>
                setTransformConfig((prev) => ({ ...prev, id: e.target.value }))
              }
              required
            />
          </div>

          <div className="group">
            <h4>Resize</h4>
            <div className="row">
              <label>Width</label>
              <input
                name="resizeWidth"
                type="number"
                min="1"
                value={transformConfig.resizeWidth}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
            <div className="row">
              <label>Height</label>
              <input
                name="resizeHeight"
                type="number"
                min="1"
                value={transformConfig.resizeHeight}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
            <div className="row">
              <label>Crop</label>
              <select
                name="resizeCrop"
                value={transformConfig.resizeCrop}
                onChange={handleChange(setTransformConfig)}
              >
                {selectOptions.crop.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <label>Gravity</label>
              <select
                name="resizeGravity"
                value={transformConfig.resizeGravity}
                onChange={handleChange(setTransformConfig)}
              >
                {selectOptions.gravity.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <label>Zoom</label>
              <input
                name="resizeZoom"
                type="number"
                value={transformConfig.resizeZoom}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
          </div>

          <div className="group">
            <h4>Rotate + Flip</h4>
            <div className="row">
              <label>Rotate</label>
              <input
                name="rotate"
                type="number"
                value={transformConfig.rotate}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
            <div className="row">
              <label>Flip</label>
              <select
                name="flip"
                value={transformConfig.flip}
                onChange={handleChange(setTransformConfig)}
              >
                {selectOptions.flip.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="group">
            <h4>Adjustments</h4>
            {sliderFields
              .filter((f) => ["brightness", "contrast", "saturation", "hue", "vibrance", "gamma", "sharpen", "unsharpMask"].includes(f.key))
              .map((field) => {
                const enableKey = `enable${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`;
                return (
                  <div key={field.key} className="slider-item">
                    <label>
                      <input
                        type="checkbox"
                        name={enableKey}
                        checked={transformConfig[enableKey]}
                        onChange={handleChange(setTransformConfig)}
                      />
                      {field.label}
                    </label>
                    <input
                      type="range"
                      name={field.key}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={transformConfig[field.key]}
                      onChange={handleChange(setTransformConfig)}
                      disabled={!transformConfig[enableKey]}
                    />
                    <span>{transformConfig[field.key]}</span>
                  </div>
                );
              })}
          </div>

          <div className="group">
            <h4>Filters</h4>
            <div className="row checkbox-row">
              <label>
                <input
                  type="checkbox"
                  name="grayscale"
                  checked={transformConfig.grayscale}
                  onChange={handleChange(setTransformConfig)}
                />
                grayscale
              </label>
              <label>
                <input
                  type="checkbox"
                  name="sepia"
                  checked={transformConfig.sepia}
                  onChange={handleChange(setTransformConfig)}
                />
                sepia
              </label>
              <label>
                <input
                  type="checkbox"
                  name="negate"
                  checked={transformConfig.negate}
                  onChange={handleChange(setTransformConfig)}
                />
                negate
              </label>
            </div>

            {sliderFields
              .filter((f) => ["blur", "pixelate", "vignette", "oilPaint"].includes(f.key))
              .map((field) => {
                const enableKey = `enable${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`;
                return (
                  <div key={field.key} className="slider-item">
                    <label>
                      <input
                        type="checkbox"
                        name={enableKey}
                        checked={transformConfig[enableKey]}
                        onChange={handleChange(setTransformConfig)}
                      />
                      {field.label}
                    </label>
                    <input
                      type="range"
                      name={field.key}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={transformConfig[field.key]}
                      onChange={handleChange(setTransformConfig)}
                      disabled={!transformConfig[enableKey]}
                    />
                    <span>{transformConfig[field.key]}</span>
                  </div>
                );
              })}

            <div className="row">
              <label>Cartoonify</label>
              <input
                type="checkbox"
                name="cartoonify"
                checked={transformConfig.cartoonify}
                onChange={handleChange(setTransformConfig)}
              />
              <input
                name="cartoonifyAmount"
                placeholder="cartoonify value (optional)"
                value={transformConfig.cartoonifyAmount}
                onChange={handleChange(setTransformConfig)}
              />
            </div>

            <div className="row">
              <label>Art</label>
              <input
                name="art"
                placeholder="art filter (al_dente, etc.)"
                value={transformConfig.art}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
          </div>

          <div className="group">
            <h4>Style / Output</h4>
            <div className="row">
              <label>Radius</label>
              <select
                name="radius"
                value={transformConfig.radius}
                onChange={handleChange(setTransformConfig)}
              >
                {selectOptions.radius.map((v) => (
                  <option key={v} value={v}>
                    {v || "None"}
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <label>Border Width</label>
              <input
                type="number"
                name="borderWidth"
                value={transformConfig.borderWidth}
                onChange={handleChange(setTransformConfig)}
              />
              <label>Color</label>
              <input
                type="text"
                name="borderColor"
                value={transformConfig.borderColor}
                onChange={handleChange(setTransformConfig)}
                placeholder="#ffffff"
              />
            </div>
            <div className="row">
              <label>Background</label>
              <input
                type="text"
                name="background"
                value={transformConfig.background}
                onChange={handleChange(setTransformConfig)}
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div className="group">
            <h4>Watermark</h4>
            <div className="row">
              <label>Text</label>
              <input
                name="watermarkText"
                placeholder="watermark text"
                value={transformConfig.watermarkText}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
            <div className="row">
              <label>Font</label>
              <input
                name="watermarkFontFamily"
                placeholder="font family"
                value={transformConfig.watermarkFontFamily}
                onChange={handleChange(setTransformConfig)}
              />
              <label>Size</label>
              <input
                type="number"
                name="watermarkFontSize"
                value={transformConfig.watermarkFontSize}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
            <div className="row">
              <label>Color</label>
              <input
                name="watermarkFontColor"
                placeholder="#ffffff"
                value={transformConfig.watermarkFontColor}
                onChange={handleChange(setTransformConfig)}
              />
              <label>Gravity</label>
              <select
                name="watermarkGravity"
                value={transformConfig.watermarkGravity}
                onChange={handleChange(setTransformConfig)}
              >
                {selectOptions.watermarkGravity.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <label>X</label>
              <input
                type="number"
                name="watermarkX"
                value={transformConfig.watermarkX}
                onChange={handleChange(setTransformConfig)}
              />
              <label>Y</label>
              <input
                type="number"
                name="watermarkY"
                value={transformConfig.watermarkY}
                onChange={handleChange(setTransformConfig)}
              />
              <label>
                <input
                  type="checkbox"
                  name="enableWatermarkOpacity"
                  checked={transformConfig.enableWatermarkOpacity}
                  onChange={handleChange(setTransformConfig)}
                />
                Opacity
              </label>
              <input
                type="range"
                name="watermarkOpacity"
                min="0"
                max="100"
                step="1"
                value={transformConfig.watermarkOpacity}
                onChange={handleChange(setTransformConfig)}
                disabled={!transformConfig.enableWatermarkOpacity}
              />
              <span>{transformConfig.watermarkOpacity}</span>
            </div>
          </div>

          <div className="group">
            <h4>Quality / Output</h4>
            <div className="row">
              <label>Quality</label>
              <input
                name="quality"
                placeholder="auto or number"
                value={transformConfig.quality}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
            <div className="row">
              <label>DPR</label>
              <input
                type="number"
                name="dpr"
                min="1"
                value={transformConfig.dpr}
                onChange={handleChange(setTransformConfig)}
              />
            </div>
            <div className="row">
              <label>Format</label>
              <select
                name="format"
                value={transformConfig.format}
                onChange={handleChange(setTransformConfig)}
              >
                {selectOptions.format.map((v) => (
                  <option key={v} value={v}>
                    {v || "None"}
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <label>Fetch Format</label>
              <select
                name="fetchFormat"
                value={transformConfig.fetchFormat}
                onChange={handleChange(setTransformConfig)}
              >
                {selectOptions.fetchFormat.map((v) => (
                  <option key={v} value={v}>
                    {v || "None"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="transform-button" type="submit">
            Transform
          </button>
        </form>
        {transformResult && (
          <div>
            <p>Transform URL:</p>
            <img
              src={transformResult}
              alt="transformed"
              style={{ maxWidth: "100%", marginTop: 12 }}
            />
            <p>{transformResult}</p>
          </div>
        )}

        <h3>User images list</h3>
        {imageList.length > 0 ? (
          <pre>{JSON.stringify(imageList, null, 2)}</pre>
        ) : (
          <p>No images loaded yet</p>
        )}
      </div>

      <div className="card">
        <h2>Status</h2>
        <p>{status}</p>
      </div>

      <style jsx>{`
        .container {
          max-width: 1000px;
          margin: 24px auto;
          font-family: "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
          color: #c9d1d9;
          padding: 16px;
          background: #0d1117;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(5, 10, 15, 0.7);
        }

        .card {
          background: #161b22;
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 18px;
          border: 1px solid #30363d;
        }

        h1,
        h2,
        h3,
        h4 {
          color: #58a6ff;
        }

        .row,
        .slider-item {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .row label,
        .slider-item label {
          font-weight: 600;
          margin-right: 6px;
          flex: 0 0 120px;
          color: #adbac7;
        }

        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="number"],
        select {
          border: 1px solid #30363d;
          border-radius: 6px;
          padding: 8px;
          flex: 1;
          min-width: 120px;
          color: #c9d1d9;
          background: #0d1117;
        }

        input[type="range"] {
          flex: 1 1 160px;
          accent-color: #58a6ff;
        }

        .group h4 {
          margin-top: 16px;
          margin-bottom: 8px;
          color: #79c0ff;
        }

        .transform-button,
        button {
          margin-top: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #39c5cf, #1f9bcf);
          color: white;
          cursor: pointer;
          font-weight: 600;
        }

        .transform-button:hover,
        button:hover {
          background: linear-gradient(135deg, #31b3bc, #147cbc);
        }

        .checkbox-row label {
          margin-right: 14px;
          font-weight: 500;
          color: #8b949e;
        }

        pre {
          background: #010409;
          border-radius: 8px;
          padding: 12px;
          overflow: auto;
          color: #adbac7;
          border: 1px solid #30363d;
        }

        .transform-form {
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 14px;
          background: #010409;
        }
      `}</style>
    </div>
  );
}
