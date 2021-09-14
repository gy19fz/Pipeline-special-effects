/**
 * @author FG
 * 
 */
const textureLoader = (window.textureLoader = new THREE.TextureLoader());
const blackBasicMaterial = (window.blackBasicMaterial = new THREE.MeshBasicMaterial({color: "black"}));

// 初始化三大件：场景、相机、渲染器
function initThree(selector) {
    // 设置两个场景 scene 和 bloomScene，bloomScene 用来渲染需要加入辉光然后抗锯齿的场景，而 scene 不作任何处理，例如精灵文字，如果被抗锯齿处理会变模糊，所以不能做任何处理
    const scene = new THREE.Scene();
    const bloomScene = new THREE.Scene();

    // 设置背景图，三种类型：
    // 1. 普通背景图
    bloomScene.background = new THREE.Color("rgb(0, 0, 0)");
    // bloomScene.background = new THREE.TextureLoader().load('img/back.jpg');

    // 2. 立方体背景图
    // scene.background = new THREE.CubeTextureLoader()
    //             .setPath('./img/')
    //             .load( [
    //                 'posx.jpg', 'negx.jpg', 'posy.jpg',
    //                 'negy.jpg', 'posz.jpg', 'negz.jpg'
    //             ] );

    // 3. 球型全景(背景)图，通过建立球体，并放大100倍实现，其中x放大倍数为负数
    // var geometry = new THREE.SphereGeometry(5, 32, 32);
    // var material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("img/back.jfif") });
    // var sphere = new THREE.Mesh(geometry, material);
    // scene.add(sphere);
    // geometry.scale(- 100, 100, 100);

    const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
    );
    camera.position.set(0, 10, 90);
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // alpha：背景透明，antialias：抗锯齿
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false; // 要使用高级效果组合器MaskPass，必须设置为false
    document.querySelector(selector).appendChild(renderer.domElement);

    // renderer.shadowMap.enabled = true; // 同意产生阴影，必须要有这个前提
    /**
    * 产生阴影4步：
    *  1. render 的 .shadowMap.enabled 设为 true，表示同意渲染器能产生阴影
    *  2. light 的 castShadow 设为 true，表示光源能产生阴影
    *  3. mesh 的 castShadow 设为 true，表示该物体能产生阴影
    *  4. 平面（物体） 的 receiveShadow 设为 true，表示该物体（一般是平面）能接受阴影
    */
    window.addEventListener('resize', onWindowResize, false);
    return { scene, bloomScene, camera, renderer };
}

// 设置灯光
function initLight() {
  const ambientLight = new THREE.AmbientLight(0x909090); // 自然光，每个几何体的每个面都有光
  const pointLight = new THREE.PointLight(0xffffd0, 1); // 点光源
  //pointLight.position.set(0, 50, 0);
  // pointLight.castShadow = true; // 使光源能产生阴影
  bloomScene.add(ambientLight);
  bloomScene.add(pointLight);
  
  const ambientLight2 = new THREE.AmbientLight(0x909090);
  const pointLight2 = new THREE.PointLight(0xffffd0, 1); // 点光源
  scene.add(ambientLight2);
  scene.add(pointLight);
  
  return [ambientLight, pointLight];
}

// 添加控制器
function initControls() {
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.addEventListener('change', function () { });
  return controls;
}

// 对传入的conf初始化
function initConfig(mesh, conf) {
  if (conf) {
    const { position, rotation, scale, repeat } = conf;
    if (position) {
      const { x, y, z } = position;
      typeof x !== 'undefined' ? (mesh.position.x = x) : null;
      typeof y !== 'undefined' ? (mesh.position.y = y) : null;
      typeof z !== 'undefined' ? (mesh.position.z = z) : null;
    }
    if (rotation) {
      const { x, y, z } = rotation;
      typeof x !== 'undefined' ? (mesh.rotation.x = x) : null;
      typeof y !== 'undefined' ? (mesh.rotation.y = y) : null;
      typeof z !== 'undefined' ? (mesh.rotation.z = z) : null;
    }
    if (scale) {
      const { x, y, z } = scale;
      typeof x !== 'undefined' ? (mesh.scale.x = x) : null;
      typeof y !== 'undefined' ? (mesh.scale.y = y) : null;
      typeof z !== 'undefined' ? (mesh.scale.z = z) : null;
    }
    if (repeat) {
      const { x, y } = repeat;
      if (typeof x !== 'undefined') {
        // 设置x方向的重复数
        mesh.wrapS = THREE.RepeatWrapping;
        mesh.repeat.x = x;
      }
      if (typeof y !== 'undefined') {
        // 设置y方向的重复数
        mesh.wrapT = THREE.RepeatWrapping;
        mesh.repeat.y = y;
      }
    }
  }
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

// 合并两张图片 img1、img2，其中图片占比 a：b（需要两张图片同高）
function mergeImage(imgSrc1, imgSrc2, a, b) {
  return new Promise((res, rej) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img1 = new Image();
    img1.src = imgSrc1;
    img1.onload = function () {
      const img2 = new Image();
      img2.src = imgSrc2;
      img2.onload = function () {
        canvas.width = img1.width * a + img2.width * b;
        canvas.height = img1.height;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.fill();

        let width = 0;
        // 绘制img1
        for (let i = 0; i < a; i++) {
          ctx.drawImage(img1, width, 0, img1.width, img1.height);
          width += img1.width;
        }

        // 绘制img2
        for (let i = 0; i < b; i++) {
          ctx.drawImage(img2, width, 0, img2.width, img2.height);
          width += img2.width;
        }

        // 合并
        const base64 = canvas.toDataURL("image/png"); // "image/png" 这里注意一下
        // const img = document.createElement('img');
        // img.setAttribute('src', base64);
        // res(img);
        res(base64);
      };
    };
  });
}

// 计算对应UV坐标
function computeUV(geometry) {
  geometry.computeBoundingBox(); // 计算外边界矩形，这样才能得到geometry的boundingBox属性值
  const max = geometry.boundingBox.max,
    min = geometry.boundingBox.min; // 获取最大、最小值
  const offset = new THREE.Vector2(0 - min.x, 0 - min.y); // 计算偏移量
  const range = new THREE.Vector2(max.x - min.x, max.y - min.y); // 计算范围
  const uvArr = geometry.getAttribute("uv");
  uvArr.array = uvArr.array.map((item, index) =>
    index % 2 ? item / range.y + offset.y : item / range.x + offset.x
  );
  geometry.setAttribute("uv", uvArr); // 将geometry的uv属性设置成我们刚刚计算出来的新uv值
  geometry.uvsNeedUpdate = true; // needUpdate必须为true才会更新
}

// 创建一个发光分组group
function createBloomGroup(...arr) {
  const group = new THREE.Group();
  arr.forEach((item) => group.add(item));
  scene.add(group);
  return group;
}

// 创建一个不发光分组group
function createNormalGroup(...arr) {
  const group = new THREE.Group();
  arr.forEach((item) => group.add(item));
  scene.add(group);
  return group;
}

// 创建一个Layer，用于实现局部辉光
function createLayer(num) {
  const layer = new THREE.Layers();
  layer.set(num);
  return layer;
}

// 创建一个克隆体
function createClone(mesh, conf) {
  const newMesh = mesh.clone();
  initConfig(newMesh, conf);
  return newMesh;
}

// 创建一个地球（球体）
function createEarth(conf) {
  const geometry = new THREE.SphereBufferGeometry(5, 64, 64);
  const texture = new THREE.TextureLoader().load("./img/earth.png");
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  initConfig(mesh, conf);
  mesh.castShadow = true; // 使该物体能产生阴影
  //mesh.layers.enable(1); // 局部辉光的layer
  return mesh;
}

// 创建一个导入的模型
function createGltfModel(path, conf) {
    return new Promise((resolve) => {
    new THREE.GLTFLoader().load(path, function (gltf) {
        var model = gltf.scene;

         model.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.layers.enable(1);
            }
          });
      
        initConfig(model, conf);
        resolve(gltf);
	});
    });
}

function createImportModel(path, conf) {
  return new Promise((resolve) => {
    const dracoLoader = new THREE.DRACOLoader().setDecoderPath("./js/draco/");
    const loader = new THREE.GLTFLoader().setDRACOLoader(dracoLoader);
    loader.load(path, function (gltf) {
      const colorArr = [
        "#999",
        "rgb(110, 105, 112)",
        "#7fffd4",
        "#ffe4c4",
        "#faebd7",
        "#a9a9a9",
        "#5f9ea0",
        "#6495ed",
      ];
      gltf.scene.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          //为几何体每个部件添加不同颜色材质
          child.material = new THREE.MeshBasicMaterial({
            color: colorArr.pop(),
          });
          // 为几何体添加线框，更逼真
          if (colorArr.length === 1) {
            const material = new THREE.LineBasicMaterial({ color: "#dcdcdc" });
            // material.depthTest = false;// 深度测试，若开启则是边框透明的效果
            const mesh = new THREE.LineSegments(
              new THREE.EdgesGeometry(child.geometry),
              material
            );
            child.add(mesh); // 往mesh里再加入一个线框mesh
          }
        }
      });
      initConfig(gltf.scene, conf);
      resolve(gltf.scene);
    });
  });
}

// 后期处理，效果合成器
function createComposer() {
  const renderPass = new THREE.RenderPass(scene, camera);
  const renderNormalPass = new THREE.RenderPass(scene, camera);

  // 产生辉光，但是不渲染到屏幕上
  const bloomComposer = new THREE.EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  const bloomPass = createUnrealBloomPass();
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);

  // 利用 MaskPass 最终渲染到屏幕上
  const finalComposer = new THREE.EffectComposer(renderer);
  finalComposer.renderTarget1.stencilBuffer = true;
  finalComposer.renderTarget2.stencilBuffer = true; // 两个都设置为true
  renderPass.clear = false;
  renderNormalPass.clear = false; //非常重要，否则 renderNormalPass 会清除掉上一个 RenderPass —— renderPass 的颜色
  finalComposer.addPass(renderPass);
  finalComposer.addPass(renderNormalPass);

  const clearMaskPass = new THREE.ClearMaskPass();
  const maskPass1 = new THREE.MaskPass(scene, camera);
  const shaderPass = createShaderPass(bloomComposer);
  const FxaaPass = createFxaaPass();
  finalComposer.addPass(maskPass1);
  finalComposer.addPass(shaderPass);
  finalComposer.addPass(FxaaPass);
  finalComposer.addPass(clearMaskPass);

  const maskPass2 = new THREE.MaskPass(scene, camera);
  finalComposer.addPass(maskPass2);
  finalComposer.addPass(clearMaskPass);

  const effectCopy = new THREE.ShaderPass(THREE.CopyShader);
  finalComposer.addPass(effectCopy);
  return { bloomComposer, finalComposer };
}

// UnrealBloomPass，辉光效果
function createUnrealBloomPass() {
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  const params = {
    exposure: 1,
    bloomThreshold: 0,
    bloomStrength: 2, //5
    bloomRadius: 0,
  };
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;
  return bloomPass;
}

// ShaderPass，着色器pass
function createShaderPass(bloomComposer) {
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: bloomComposer.renderTarget2.texture },
    },
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
    defines: {},
  });
  const shaderPass = new THREE.ShaderPass(shaderMaterial, "baseTexture");
  shaderPass.needsSwap = true;
  return shaderPass;
}

// 抗锯齿，fxaa、smaa、ssaa都可以抗锯齿，抗锯齿效果依次减弱
function createFxaaPass() {
  let FxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  FxaaPass.material.uniforms["resolution"].value.x =
    1 / (window.innerWidth * pixelRatio);
  FxaaPass.material.uniforms["resolution"].value.y =
    1 / (window.innerHeight * pixelRatio);
  FxaaPass.renderToScreen = true;
  return FxaaPass;
}

// 创建一个弧角矩形
function createArcRect(width, height, arc) {
  const shape = new THREE.Shape();
  const w = width - arc;
  const h = height - arc;
  shape.moveTo(w, height);
  shape.arc(0, -1 * arc, arc, Math.PI / 2, 0, true);
  shape.lineTo(width, arc);
  shape.arc(-1 * arc, 0, arc, 0, (3 * Math.PI) / 2, true);
  shape.lineTo(arc, 0);
  shape.arc(0, arc, arc, (3 * Math.PI) / 2, Math.PI, true);
  shape.lineTo(0, h);
  shape.arc(arc, 0, arc, Math.PI, Math.PI / 2, true);
  shape.lineTo(w, height);
  return shape;
}

// 创建一个平面
function createFace(width, height, arc, conf) {
  const shape = createArcRect(width, height, arc);
  const geometry = new THREE.ShapeBufferGeometry(shape, 64);
  const material = new THREE.MeshBasicMaterial({
    color: "rgb(159, 161, 162)",
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  initConfig(mesh, conf);
  // mesh.receiveShadow = true; // 使该物体能接受阴影
  return mesh;
}

// 创建一条线，可以是曲线，传入一组点
function createLine(pointsArr) {
  pointsArr = pointsArr.map((point) => new THREE.Vector3(...point));
  const geometry = new THREE.BufferGeometry().setFromPoints(pointsArr);
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const line = new THREE.Line(geometry, material);
  return line;
}

// 创建一条路径，可以是三维路径，传入一组点
function createPath(pointsArr) {
  pointsArr = pointsArr.map((point) => new THREE.Vector3(...point));

  // 方法一：自定义三维路径
  /*
  const path = new THREE.CurvePath();
  for (let i = 0; i < pointsArr.length - 1; i++) {
    const lineCurve = new THREE.LineCurve3(pointsArr[i], pointsArr[i + 1]);
    path.curves.push(lineCurve);
  }
  */
  // 方法二：利用CatmullRomCurve3 创建三位路径，不过是平滑的三维样条曲线
  const path = new THREE.CatmullRomCurve3(pointsArr);

  return path;
}

// 创建一种纹理（此处用来模拟管线动画）
function createTexture(path, conf) {
  const texture = textureLoader.load(path);
  initConfig(texture, conf);
  return texture;
}

// 创建一条管道（自己模拟TubeGeometry实现的管线）
async function createMyTube(...pointsArr) {
  // shape为圆形，可以设置管道半径
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.3, 0, Math.PI * 2);

  // 自定义管道路径
  const path = createPath(pointsArr);
  const extrudeSettings = {
    bevelEnabled: false,
    steps: 1, // step设置为1，保证侧面只有一个平面，如果想更高，可以通过scale放大
    extrudePath: path, // extrudePath需要是THREE.Curve对象
    // curve是基类，表示曲线，子类有lineCurve二维直线，lineCurve3三维直线
    // curvePath是一组curve构成的路径，可以算是curve的子类，子类path二维路径，shape是path的子类
  };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // 模拟管线运动动画
  const base64 = await mergeImage("./img/1.png", "./img/2.png", 1, 10);
  const texture = createTexture(base64, { repeat: { x: 1 } });
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.z = 64;
  return { texture, mesh };
}

// 创建一条管道利用 TubeGeometry
async function createTube(conf) {
    const path = createPath(conf.points);
    const geometry = new THREE.TubeGeometry(path, 100, conf.radius);
    const textureLoader = new THREE.TextureLoader();
    let material, texture;
    if(conf.texture !== undefined) {
        texture = textureLoader.load(conf.texture);
        // 设置阵列模式为 RepeatWrapping
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // 设置x方向的偏移(沿着管道路径方向)，y方向默认1
        // 等价texture.repeat= new THREE.Vector2(3,1)
        texture.repeat.x = 3;

        // 模拟管线运动动画，将两个素材图按比例合并，然后生成贴图texture
        //const base64 = await mergeImage("./img/1.png", "./img/3.png", 6, 7);
        //const texture = createTexture(base64, { repeat: { x: 15 } });
        material = new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true
        });
    }
    else{
        material = new THREE.MeshPhongMaterial({
            color: conf.color,
            transparent: true,
            opacity: conf.opacity,
        });
        material.depthWrite=false;
    }
    const mesh = new THREE.Mesh(geometry, material);
    return { texture, mesh };
}

// 创建立体3D文字
function createText(text, color, conf) {
  return new Promise((res) => {
    // new THREE.FontLoader().load("./font/simhei.min.json", function (font) {
    new THREE.TTFLoader().load("../font/simhei.ttf", function (data) {
      const font = new THREE.Font(data);
      const geometry = new THREE.TextBufferGeometry(text, {
        font,
        size: 3,
        height: 1,
        curveSegments: 64,
      });
      geometry.center();
      const material = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      initConfig(mesh, conf);
      res(mesh);
    });
  });
}

// 创建文字画布
function createTextCanvas(text) {
  const canvas = document.createElement("canvas");
  // 画布最合适的适配尺寸
  canvas.height = 300;
  canvas.width = 300;
  canvas.style.border = "1px solid red";
  canvas.style.borderRadius = "35px";
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(163, 92, 48, 1)";
  // ctx.fillRect(0, 0, 300, 300);
  ctx.fillRect(50, 50, 200, 200);
  ctx.font = "80px Microsoft YaHei";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "green";
  ctx.fillText(text, 150, 150);
  return canvas;
}

// 创建永远朝向自己这一面的文字
async function createSpriteText(selector, conf) {
  const elem = document.querySelector(selector);
  const canvas = await html2canvas(elem, {
    x: elem.offsetLeft, // 加入x、y配置，防止画布偏移 产生部分空白
    y: elem.offsetTop,
  });
  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; // 提高清晰度
  texture.minFilter = THREE.NearestFilter;
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    opacity: 0.8,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  const shape = createArcRect((15 * canvasW) / canvasH, 15, 2.5);
  const geometry = new THREE.ShapeBufferGeometry(shape, 64);
  computeUV(geometry);
  sprite.geometry = geometry;
  initConfig(sprite, conf);
  return { spriteMaterial, sprite };
}


// 创建围绕物体的辉光效果
function createLightBeam(width, height, arc, color, conf) {
  const shape = createArcRect(width, height, arc);
  const extrudeSettings = {
    steps: 64,
    depth: 1, // step设置为1，保证侧面只有一个平面，如果想更高，可以通过scale放大
    bevelEnabled: false,
  };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const bottomMaterial = new THREE.MeshBasicMaterial({
    visible: false,
  });
  const texture = createTexture("./img/gradient.png");
  const sideMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    depthWrite: true,
    color,
  });
  const mesh = new THREE.Mesh(geometry, [bottomMaterial, sideMaterial]);
  initConfig(mesh, conf);
  return mesh;
}
