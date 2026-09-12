import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
// import { RGBELoader } from "three/addons/loaders/RGBELoader.js"
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
// import { PMREMGenerator } from "three"
import * as Utils from "./src/js/utils1.js"
import * as TopUtils from "./src/js/topUtils.js"

// import { LineGeometry } from "three/addons/lines/LineGeometry.js"
// import { LineMaterial } from "three/addons/lines/LineMaterial.js"
// import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
// import { Line2 } from "three/addons/lines/Line2.js"
// import { VertexNormalsHelper } from "three/addons/helpers/VertexNormalsHelper.js"

/////////////////////////////////////////////////////////////////
// custom
/////////////////////////////////////////////////////////////////

// Webgl
// 　└ stage
// 　└ particle

/////////////////////////////////////////////////////////////////
// Stage
/////////////////////////////////////////////////////////////////

class Stage {
  constructor() {
    this.rendererParam = {
      clearColor: 0x333333,
      width: window.innerWidth,
      height: window.innerHeight,
    }
    this.cameraParam = {
      fov: 45,
      near: 0.1,
      far: 20000,
      lookAt: new THREE.Vector3(0, 0, 0),
      x: 163,
      y: 110,
      z: 68,
    }
    this.scene = null
    this.camera = null
    this.renderer = null
    this.isInitialized = false
    this.orbitControls = null
    this.isDev = false
  }
  init() {
    this._setScene()
    this._setRender()
    this._setCamera()
    this._setDev()
    this._setLight()
  }
  _setScene() {
    this.scene = new THREE.Scene()
  }
  _setRender() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(new THREE.Color(this.rendererParam.clearColor))
    this.renderer.setSize(this.rendererParam.width, this.rendererParam.height)
    const wrapper = document.getElementById("webgl")
    wrapper.appendChild(this.renderer.domElement)
  }
  _setCamera() {
    // 初回のみ
    if (!this.isInitialized) {
      this.camera = new THREE.PerspectiveCamera(
        0,
        0,
        this.cameraParam.near,
        this.cameraParam.far,
      )
      this.camera.position.set(
        this.cameraParam.x,
        this.cameraParam.y,
        this.cameraParam.z,
      )
      this.camera.lookAt(this.cameraParam.lookAt)
      this.isInitialized = true
    }
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.camera.aspect = windowWidth / windowHeight
    this.camera.fov = this.cameraParam.fov

    this.camera.updateProjectionMatrix() // ⭐️⭐️⭐️
    this.renderer.setSize(windowWidth, windowHeight)
  }
  _setLight() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    const L = 5000
    directionalLight.shadow.camera.top = L
    directionalLight.shadow.camera.bottom = -L
    directionalLight.shadow.camera.left = -L
    directionalLight.shadow.camera.right = L
    directionalLight.shadow.camera.near = 0
    directionalLight.shadow.camera.far = L * 3

    directionalLight.position.set(500, 1000, 500)
    directionalLight.castShadow = true

    // 影の解像度を設定
    const mapS = 4096
    directionalLight.shadow.mapSize.set(mapS, mapS)

    const ambientLight = new THREE.AmbientLight(0xff0000, 1.0)

    // this.scene.add(ambientLight);
    // this.scene.add(directionalLight);

    const helper = new THREE.DirectionalLightHelper(directionalLight)
    // this.scene.add(helper);

    const pointLight = new THREE.PointLight(0xffffff, 1, 10)
    pointLight.position.set(-20, -60, 70)
    // this.scene.add(pointLight);

    const sphereSize = 10
    const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize)
    // this.scene.add(pointLightHelper);

    const pointLight2 = new THREE.PointLight(0x0000ff, 0.5, 10)
    pointLight2.position.set(20, 60, -70)
    // this.scene.add(pointLight2);

    const pointLightHelper2 = new THREE.PointLightHelper(
      pointLight2,
      sphereSize,
    )
    // this.scene.add(pointLightHelper2);

    const pointLight3 = new THREE.PointLight(0xff00ff, 0.3, 10)
    pointLight3.position.set(20, -100, -50)
    // this.scene.add(pointLight3);

    const pointLightHelper3 = new THREE.PointLightHelper(
      pointLight3,
      sphereSize,
    )
    // this.scene.add(pointLightHelper3);
  }
  _setDev() {
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
    )
    this.orbitControls.enableDamping = true
    // this.orbitControls.enableZoom = false;
    this.orbitControls.enablePan = false
    this.orbitControls.maxDistance = 2000
    this.orbitControls.minDistance = 1

    // console.log(this.orbitControls.target);

    Utils.loadCameraAttributeFromLocal(this.camera, this.orbitControls)

    this.isDev = true

    const stage = this
    window.addEventListener("keydown", function (e) {
      if (e.key == "s") {
        Utils.saveCameraAttributeToLocal(stage.camera, stage.orbitControls)
      }
      if (e.key == "l") {
        Utils.loadCameraAttributeFromLocal(stage.camera, stage.orbitControls)
      }
    })
    Utils.makeEnvironment(stage)
  }
  _render() {
    this.renderer.render(this.scene, this.camera)
    if (this.isDev) this.orbitControls.update()
  }
  onResize() {
    this._setCamera()
  }
  onRaf() {
    // console.log("onRef")

    // console.log(this.model)
    this._render()

    // const speed = 0.001;
    // if (!this.model) return;
    // this.model.rotation.x += speed;
    // this.model.rotation.y += speed
    // this.model.rotation.z += speed;
  }
} // Stage

/////////////////////////////////////////////////////////////////
// Particle
/////////////////////////////////////////////////////////////////

class Particle {
  constructor(stage) {
    this.stage = stage
    this.promiseList = []
    this.baseMeshes = []
    this.meshes = []
    this.positions = []
    this.firstPositions = [] // start
    this.positions_dest = [] // to
    this.wires = [] // from, to
    this.pointAry = []
    this.meshesMaken = false
    this.meshesCount = 1200
    this.model = null
    this.wireOpacity = 0.1 // 0.02
    this.repeatCount = 0
    this.animated = false
    this.animating = true
    // this.animating = true;
    this.modelAnimating = false
    this.spheres = []
  }
  init() {
    Promise.all(this.promiseList).then(() => {
      this._setMesh()
    })
  }

  _setMesh() {
    const stage = this.stage
    const particle = this

    const axes = new THREE.AxesHelper(100)
    // stage.scene.add(axes);

    async function init() {
      // （1）loadGLTF
      await TopUtils.loadGLTFModel(particle, "./src/model/25-01-17_grid2.glb")

      stage.scene.add(particle.model)

      const s = 0.95 ////;
      let i = 0
      particle.model.traverse((child) => {
        if (child.isMesh) {
          // child.scale.set(s, s, s);
          // console.log(child);
          // console.log(child.position);
          // i++;
          // console.log(i);
          // child.material = new THREE.MeshStandardMaterial({
          //   color: 0x0000ff,
          //   roughness: 0.5,
          //   metalness: 0.5,
          //   flatShading: true,
          // });
          // child.material.needsUpdate = true;
        }
      })
      // let centers = new Float32Array(particle.model.children.length * 3);
      // for (let i = 0; i < particle.model.children.length * 3; i += 3) {
      //   const child = particle.model.children[i / 3];
      //   centers[i + 0] = child.position.x;
      //   centers[i + 1] = child.position.y;
      //   centers[i + 2] = child.position.z;
      // }

      const radius = 1.7
      const div = 30
      const makeCirclePosition = (mesh) => {
        const geometry = new THREE.BufferGeometry()

        const positionAttribute = mesh.geometry.attributes.position
        const uv = mesh.geometry.attributes.uv

        geometry.setAttribute("position", positionAttribute)
        geometry.setAttribute("uv", uv)
        const indices = mesh.geometry.index.array
        geometry.setIndex([...indices])

        // 変形後のジオメトリ（Sphere）の頂点座標の配列
        const spherePositions = []

        // 頂点の数だけループを回す
        for (let i = 0; i < positionAttribute.count; i++) {
          // 立方体の頂点座標を取得
          const x = positionAttribute.getX(i)
          const y = positionAttribute.getY(i)
          const z = positionAttribute.getZ(i)

          // 頂点ベクトルを正規化（長さを同じに）して、球形の頂点にする
          const vertex = new THREE.Vector3(x, y, z)
          const spheredVertex = vertex.normalize().multiplyScalar(radius)

          spherePositions.push(
            spheredVertex.x,
            spheredVertex.y,
            spheredVertex.z,
          )
        }
        // ジオメトリの変形先として、計算した座標を登録
        geometry.morphAttributes.position = [
          new THREE.Float32BufferAttribute(spherePositions, 3),
        ]
        geometry.computeVertexNormals()

        const material = new THREE.MeshPhongMaterial({
          side: THREE.DoubleSide,
          map: mesh.material.map,
          vertexColors: true,
          color: mesh.material.color,
        })

        const mat = mesh.material.clone()
        mat.flatShading = true
        mat.opacity = 1.0
        mat.roughness = Math.random()
        // const rand = Math.random();
        // mat.wireframe = rand > 0.5;

        const h = Math.random()
        const s = Math.random() * 0.8
        const l = Math.random() * 0.5
        const color = new THREE.Color().setHSL(h, s, l)
        mat.color = color
        const circle = new THREE.Mesh(geometry, mat)
        circle.name = "circle"
        circle.forword = true
        circle.animating = false
        mesh.add(circle)
        mesh.material.transparent = true
        mesh.material.opacity = 0
        particle.spheres.push(circle)
        //   if (circle.morphTargetInfluences[0] < 0) {
        //     forword = true;
        //     counting = true;
        //   } else if (circle.morphTargetInfluences[0] > 1) {
        //     forword = false;
        //     counting = true;
        //   }
        //   if (counting) counter++;
        //   if (counter > waitTime) {
        //     counting = false;
        //     counter = 0;
        //   }

        //   if (counting == false) {
        //     circle.morphTargetInfluences[0] += forword ? speed : -speed;
        //   }
        //   requestAnimationFrame(loop);
        // };
        // loop();
      }

      for (let i = 0; i < particle.model.children.length; i++) {
        const child = particle.model.children[i]
        makeCirclePosition(child)
      }

      const saveSpheresMorphTargetInfluences = () => {
        const ary = [...Array(particle.spheres.length)].map(() => 0)

        for (let i = 0; i < particle.spheres.length; i++) {
          const circle = particle.spheres[i]
          ary[i] = circle.morphTargetInfluences[0]
        }
        // console.log(ary); // => [ 0, 0, 0 ]
        localStorage.setItem("SpheresMorphTargetInfluences", ary)
      }

      const loadSpheresMorphTargetInfluences = () => {
        let ary = localStorage.getItem("SpheresMorphTargetInfluences")
        if (ary == null) return
        const stringArray = ary.split(",") // localStorageは文字列 🌟
        const intArray = stringArray.map(Number) // 数値に変換
        for (let i = 0; i < particle.spheres.length; i++) {
          const circle = particle.spheres[i]
          circle.morphTargetInfluences[0] = intArray[i]
        }
      }
      loadSpheresMorphTargetInfluences()

      const morphSpeed = 0.03
      const morphLoop = () => {
        particle.spheres.forEach((circle) => {
          if (circle.animating == true) {
            if (circle.morphTargetInfluences[0] < 0) circle.forword = true
            if (circle.morphTargetInfluences[0] > 1) circle.forword = false
            circle.morphTargetInfluences[0] += circle.forword
              ? morphSpeed
              : -morphSpeed
          }
        })
        saveSpheresMorphTargetInfluences()
        requestAnimationFrame(morphLoop)
      }
      morphLoop()

      let hoveredObject = null
      const action = (mesh) => {
        let circle
        if (mesh.name != "circle") {
          circle = mesh.children[0]
        } else {
          circle = mesh
        }
        if (hoveredObject != null && hoveredObject != circle) {
          hoveredObject.animating = false
          hoveredObject = null
        }
        hoveredObject = circle
        hoveredObject.animating = true
      }
      const checkTapMesh = () => {
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        window.addEventListener("mousemove", (event) => {
          mouse.x = (event.clientX / window.innerWidth) * 2 - 1
          mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
          raycaster.setFromCamera(mouse, stage.camera)
          const intersects = raycaster.intersectObjects(particle.model.children)
          if (intersects.length > 0) {
            const intersectedObject = intersects[0].object
            action(intersectedObject)
          } else {
            // 離れた！
            if (hoveredObject != null) {
              hoveredObject.animating = false
              hoveredObject = null
            }
          }
        })
      }
      checkTapMesh()
    }
    init()

    // async function main() {
    //   while (true) {
    //     await init();
    //   }
    // }
    // main();
  } // _setMesh()

  _render() {}
  onResize() {}
  onRaf() {
    console.log(this.model)

    const speed = 0.002
    if (!this.model) return
    if (this.animating) {
      this.model.rotation.y += speed
      // this.model.rotation.z += speed
      // this.model.rotation.x += speed
    }

    // if (this.mesh) {
    //   this.mesh.material.uniforms.u_time.value += 0.02;
    //   this.mesh.rotation.y += 0.005;
    // }

    // const particle = this;

    // function animateMeshes() {
    //   requestAnimationFrame(animateMeshes);

    //   particle.model?.traverse((child) => {
    //     if (child.isMesh) {
    //       if (isNaN(child.speed)) return; // ⭐️⭐️⭐️
    //       const add = Math.round(child.speed * 1000) / 5000;
    //       child.rotation.x += add;
    //       child.rotation.y -= add * 2;
    //       child.rotation.z += add;
    //     }
    //   });
    // }
    // animateMeshes();
  }
} // Particle

/////////////////////////////////////////////////////////////////
//  WebGL（全体）
/////////////////////////////////////////////////////////////////

class Webgl {
  constructor() {
    const stage = new Stage()
    stage.init()

    const particle = new Particle(stage)
    particle.init()

    window.addEventListener("resize", () => {
      stage.onResize()
      particle.onResize()
    })

    const _raf = () => {
      window.requestAnimationFrame(() => {
        _raf()
        stage.onRaf()
        particle.onRaf()
      })
    }
    _raf()
  }
}

const gl = new Webgl()
