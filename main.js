import * as BABYLON from '@babylonjs/core';
import earcut from 'earcut';

// stores coordinate for vertex
var clickedPoints = [];
var cnt = 0;
var lines = [];
var editlines = [];
// height of extruded object
const h = '0.3';
// arry to store coordinates of vertice when edited
var path = [];

async function drawcanvas() {
  const canvas = document.getElementById('drawCanvas');
  const engine = new BABYLON.Engine(canvas);

  // select 2d shape you want to extrude
  const createScene = async function () {
    var scene = new BABYLON.Scene(engine);
    scene.createDefaultCameraOrLight(true, false, true);
    var ground = BABYLON.MeshBuilder.CreateGround('', {
      height: 2,
      width: 2
    });
    ground.position = new BABYLON.Vector3(0, 0, 0);

    var sphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: 0.015 }, scene);
    console.log(sphere);
    sphere.position = new BABYLON.Vector3(0, 0, 0);
    const material = new BABYLON.StandardMaterial("blackMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    sphere.material = material;

    scene.onPointerDown = (evt, pickResult) => {
      if (pickResult.hit && pickResult.pickedMesh === ground && evt.button === 0) {
        const pickedPoint = pickResult.pickedPoint;

        const groundWidth = ground.getBoundingInfo().boundingBox.maximumWorld.x - ground.getBoundingInfo().boundingBox.minimumWorld.x;
        const groundHeight = ground.getBoundingInfo().boundingBox.maximumWorld.z - ground.getBoundingInfo().boundingBox.minimumWorld.z;
        // check whether point clicked is in inside ground
        if (pickedPoint.x >= ground.position.x - groundWidth / 2 &&
          pickedPoint.x <= ground.position.x + groundWidth / 2 &&
          pickedPoint.z >= ground.position.z - groundHeight / 2 &&
          pickedPoint.z <= ground.position.z + groundHeight / 2) {

          const x = pickedPoint.x.toFixed(2);
          const y = pickedPoint.y.toFixed(2);
          const z = pickedPoint.z.toFixed(2);

          const coordinates = [x, y, z];
          clickedPoints.push(coordinates);
          cnt++;

          // display sphere at point clicked
          var sphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: 0.015 }, scene);
          console.log(sphere);
          sphere.position = new BABYLON.Vector3(x, y, z);
          const material = new BABYLON.StandardMaterial("blackMaterial", scene);
          material.diffuseColor = new BABYLON.Color3(0, 0, 0);
          sphere.material = material;
          // sphere.parent = ground;
          scene.addMesh(sphere);
          console.log("sphere created");

          if (cnt > 1) {
            // logic to connect spheres with lines to get idea of shape you want to extrude
            if (lines.length == cnt) {
              lines[cnt - 1].dispose();
              lines.pop();
            }

            const pointA = new BABYLON.Vector3(clickedPoints[cnt - 1][0], clickedPoints[cnt - 1][1], clickedPoints[cnt - 1][2]);
            const pointB = new BABYLON.Vector3(clickedPoints[cnt - 2][0], clickedPoints[cnt - 2][1], clickedPoints[cnt - 2][2]);

            // Create line mesh
            var linePoints = [pointA, pointB];
            var line = BABYLON.MeshBuilder.CreateLines("line", { points: linePoints }, scene);
            line.color = new BABYLON.Color3(0, 0, 0);
            line.thickness = 0.1;
            lines.push(line);
            // line.parent = ground;

            const pointC = new BABYLON.Vector3(clickedPoints[cnt - 1][0], clickedPoints[cnt - 1][1], clickedPoints[cnt - 1][2]);
            const pointD = new BABYLON.Vector3(clickedPoints[0][0], clickedPoints[0][1], clickedPoints[0][2]);

            // Create line mesh
            linePoints = [pointC, pointD];
            line = BABYLON.MeshBuilder.CreateLines("line", { points: linePoints }, scene);
            line.color = new BABYLON.Color3(0, 0, 0);
            line.thickness = 0.1;
            lines.push(line);
            // line.parent = ground;
            console.log(lines.length);

            // Adjust line position (assuming flat ground)
            const groundHeight = ground.getBoundingInfo().boundingBox.minimumWorld.y;
            line.position.y = groundHeight;

            // Add line to the scene
            scene.addMesh(line);
          }

        } else {
          console.log("Click outside ground boundaries");
        }
      }
    };

    return scene;
  };

  var scene = await createScene();

  engine.runRenderLoop(function () {
    scene.render();
  });

  window.addEventListener('resize', function () {
    engine.resize();
  });
};

async function extrudecanvas() {
  const canvas = document.getElementById('extrudeCanvas');
  const engine = new BABYLON.Engine(canvas);

  console.log(clickedPoints);
  const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    // Default camera and light
    scene.createDefaultCameraOrLight(true, false, true);

    // Ground plane
    const ground = BABYLON.MeshBuilder.CreateGround('', {
      height: 2,
      width: 2
    });
    ground.position = new BABYLON.Vector3(0, 0, 0);

    var points = [];
    for (let i = 0; i < cnt; i++) {
      points.push(new BABYLON.Vector3(parseFloat(clickedPoints[i][0]), parseFloat(h), parseFloat(clickedPoints[i][2])));
    }

    // console.log(points);
    // points are extruded to form polygon
    BABYLON.PolygonMeshBuilder.prototype.bjsEarcut = earcut;
    var holes = [];
    const extrudedPolygon = BABYLON.MeshBuilder.ExtrudePolygon("polygon", { shape: points, holes: holes, depth: parseFloat(h), sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene, earcut);
    extrudedPolygon.enableEdgesRendering();
    extrudedPolygon.edgesWidth = 4;
    extrudedPolygon.edgesColor = new BABYLON.Color4(0, 0, 0, 0);
    extrudedPolygon.parent = ground;
    extrudedPolygon.position = new BABYLON.Vector3(0, parseFloat(h), 0);
    // console.log("extrudedpolygon position" + extrudedPolygon.position);
    const pointerDragBehavior = new BABYLON.PointerDragBehavior({ dragPlaneNormal: new BABYLON.Vector3(0, 1, 0) });
    extrudedPolygon.addBehavior(pointerDragBehavior);

    return scene;
  };

  const scene = createScene();

  engine.runRenderLoop(function () {
    scene.render();
  });

  window.addEventListener('resize', function () {
    engine.resize();
  });

}

async function editcanvas() {
  const canvas = document.getElementById('editCanvas');
  const engine = new BABYLON.Engine(canvas);

  const createScene = async function () {
    var scene = new BABYLON.Scene(engine);
    scene.createDefaultCameraOrLight(true, false, true);

    var ground = BABYLON.MeshBuilder.CreateGround('', {
      height: 2,
      width: 2
    });
    ground.position = new BABYLON.Vector3(0, 0, 0);

    // creating array to store faces formed using vertex
    var faces = [], lower = [], upper = [];
    for (let i = 0; i < cnt - 1; i++) {
      faces.push([i, i + 1, i + 1 + cnt, i + cnt]);
    }
    faces.push([cnt - 1, 0, cnt, 2 * cnt - 1]);

    for (let i = 0; i < cnt; i++) {
      upper.push(i + cnt);
    }
    for (let i = cnt - 1; i >= 0; i--) {
      lower.push(i);
    }
    faces.push(lower);
    faces.push(upper);

    const material = new BABYLON.StandardMaterial("blackMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);

    var points = [];
    for (let i = 0; i < cnt; i++) {
      points.push(new BABYLON.Vector3(parseFloat(clickedPoints[i][0]), parseFloat(h), parseFloat(clickedPoints[i][2])));
    }

    // console.log(points);
    // initially extruded object
    BABYLON.PolygonMeshBuilder.prototype.bjsEarcut = earcut;
    var holes = [];
    const extrudedPolygon = BABYLON.MeshBuilder.ExtrudePolygon("polygon", { shape: points, holes: holes, depth: parseFloat(h), sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene, earcut);
    extrudedPolygon.enableEdgesRendering();
    extrudedPolygon.edgesWidth = 4;
    extrudedPolygon.edgesColor = new BABYLON.Color4(0, 0, 0, 0);
    extrudedPolygon.parent = ground;
    extrudedPolygon.position = new BABYLON.Vector3(0, parseFloat(h), 0);
    var mesh = extrudedPolygon;

    for (let i = 0; i < cnt; i++) {
      points[i][1] = 0;
    }
    for (let i = 0; i < cnt; i++) {
      points.push(new BABYLON.Vector3(parseFloat(clickedPoints[i][0]), parseFloat(h), parseFloat(clickedPoints[i][2])));
    }
    for (let i = 0; i < cnt; i++) {
      clickedPoints.push([clickedPoints[i][0], h, clickedPoints[i][2]]);
    }

    var sphere = [];
    sphere[0] = BABYLON.MeshBuilder.CreateSphere("sphere0", { diameter: 0.02 }, scene);
    sphere[0].material = material;
    sphere[0].position = new BABYLON.Vector3(parseFloat(clickedPoints[0][0]), parseFloat(clickedPoints[0][1]), parseFloat(clickedPoints[0][2]));
    path.push(sphere[0]);

    // adding spheres and drag behaviour to spheres
    for (var i = 1; i < 2 * cnt; i++) {
      sphere[i] = sphere[0].clone("sphere" + i);
      const dragBehavior = new BABYLON.PointerDragBehavior();
      sphere[i].addBehavior(dragBehavior);
      sphere[i].position = new BABYLON.Vector3(parseFloat(clickedPoints[i][0]), parseFloat(clickedPoints[i][1]), parseFloat(clickedPoints[i][2]));
      path.push(sphere[i]);
    }

    // upadtes position of sphere when dragged
    var updatePath = function () {
      let a = 0;
      for (var i = 0; i < 2 * cnt; i++) {
        if (path[i] === sphere[i].position) {
          a++;
        }
        path[i] = sphere[i].position;
      }

    };

    updatePath();

    scene.onPointerUp = function (evt) {
      updatePath();
      console.log(path);
    };

    return scene;
  };

  var scene = await createScene();

  engine.runRenderLoop(function () {
    scene.render();
  });

  window.addEventListener('resize', function () {
    engine.resize();
  });
};

async function finalCanvas() {
  const canvas = document.getElementById('finalCanvas');
  const engine = new BABYLON.Engine(canvas);


  const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    // Default camera and light
    scene.createDefaultCameraOrLight(true, false, true);

    // Ground plane
    const ground = BABYLON.MeshBuilder.CreateGround('', {
      height: 2,
      width: 2
    });
    ground.position = new BABYLON.Vector3(0, 0, 0);

    var faces = [], lower = [], upper = [];
    for (let i = 0; i < cnt - 1; i++) {
      faces.push([i, i + 1, i + 1 + cnt, i + cnt]);
    }
    faces.push([cnt - 1, 0, cnt, 2 * cnt - 1]);

    for (let i = 0; i < cnt; i++) {
      upper.push(i + cnt);
    }
    for (let i = cnt - 1; i >= 0; i--) {
      lower.push(i);
    }
    faces.push(lower);
    faces.push(upper);
    // var v = [[-0.5,0,0], [0,0,0.5], [-0.5,0,-0.5], [-0.5,0.5,0], [0,0.5,0.5], [-0.5,0.4,-0.5]];

    console.log(path);
    for (let i = 0; i < 2 * cnt; i++) {
      clickedPoints[i][0] = path[i].x;
      clickedPoints[i][1] = path[i].y;
      clickedPoints[i][2] = path[i].z;
    }
    console.log(clickedPoints);

    // ceates final shape
    const heptagonalPrism = {
      "name": "Heptagonal Prism", "category": ["Prism"], "vertex": clickedPoints,
      "face": faces
    };

    const heptPrism = BABYLON.MeshBuilder.CreatePolyhedron("h", { custom: heptagonalPrism }, scene);
    const heptPrism1 = BABYLON.Mesh.CreatePolyhedron("h", { custom: heptagonalPrism }, scene);


    return scene;
  };

  const scene = createScene();

  engine.runRenderLoop(function () {
    scene.render();
  });

  window.addEventListener('resize', function () {
    engine.resize();
  });

}

const screen1 = document.getElementById('screen1');
const screen2 = document.getElementById('screen2');
const screen3 = document.getElementById('screen3');
const screen4 = document.getElementById('screen4');
const drawCanvas = document.getElementById('drawScene');
const extrudeCanvas = document.getElementById('extrudeScene');
const editCanvas = document.getElementById('editScene');
const finalcanvas = document.getElementById('finalScene');
const finish = document.getElementById('finish');
const final = document.getElementById('final');
const editext = document.getElementById('heading21');

draw.addEventListener("click", function (event) {
  screen1.style.display = 'none';
  screen2.style.display = 'flex';
  drawcanvas();
  drawCanvas.style.display = 'flex';
});

extrude.addEventListener("click", function (event) {
  screen2.style.display = 'none';
  screen3.style.display = 'flex';
  extrudecanvas();
  extrudeCanvas.style.display = 'flex';
});

edit.addEventListener("click", function (event) {
  screen3.style.display = 'none';
  screen4.style.display = 'flex';
  finalcanvas.style.display = 'none';
  editcanvas();
  editCanvas.style.display = 'flex';
});

finish.addEventListener("click", function (event) {
  editCanvas.style.display = 'none';
  finalcanvas.style.display = 'flex';
  finish.style.display = 'none';
  final.style.display = 'flex';
  editext.style.display = 'none';
  finalCanvas();
});
