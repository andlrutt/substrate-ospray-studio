class WorldObject {
  sceneGraphObj = null;

  constructor(
    displayName,
    internalName,
    defaultTranslation = [0, 0, 0],
    defaultRotation = { i: 0, j: 0, k: 0, r: 1 },
    defaultScale = [1, 1, 1]
  ) {
    this.displayName = displayName;
    this.internalName = internalName;
    this.defaultTranslation = defaultTranslation;
    this.defaultRotation = defaultRotation;
    this.defaultScale = defaultScale;
  }

  get translation() {
    return this.sceneGraphObj.children[0].children.find(
      (child) => child.name === "translation"
    ).value;
  }

  set translation(val) {
    this.sceneGraphObj.children[0].children.find(
      (child) => child.name === "translation"
    ).value = val;
  }

  get rotation() {
    return this.sceneGraphObj.children[0].children.find(
      (child) => child.name === "rotation"
    ).value;
  }

  set rotation(val) {
    this.sceneGraphObj.children[0].children.find(
      (child) => child.name === "rotation"
    ).value = val;
  }

  get scale() {
    return this.sceneGraphObj.children[0].children.find(
      (child) => child.name === "scale"
    ).value;
  }

  set scale(val) {
    let objProp = this.sceneGraphObj.children[0].children.find(
      (child) => child.name === "scale"
    );

    objProp.value = [val, val, val];
  }
}

var g_scene_graph = null;
var initial_scene_graph = null;
const RAAS_LOCATION = "http://127.0.0.1:8000/";
var editor = null;
var movieFrames = [];
var recording = false;
var worldObjs = [
  new WorldObject("tree", "tree_small_02_4k_importer"),
  new WorldObject("apple", "food_apple_01_4k_importer"),
  new WorldObject("lightbulb", "lightbulb_01_4k_importer"),
  new WorldObject("table", "side_table_tall_01_4k_importer"),
  new WorldObject("bust", "marble_bust_01_4k_importer"),
];
var selectedObject = null;


function load_world_objs(scene_graph) {
  for (i = 0; i < scene_graph.world.children.length; i++) {
    if (scene_graph.world.children[i].type === "IMPORTER") {
      let worldObj = worldObjs.find(
        (worldObj) =>
          worldObj.internalName === scene_graph.world.children[i].name
      );
      worldObj.sceneGraphObj = scene_graph.world.children[i];
      console.log(worldObj.sceneGraphObj)
    }
  }
  return scene_graph;
}

function render_world_obj_defaults(worldObjs) {
  for (let i = 0; i < worldObjs.length; i++) {
    worldObjs[i].translation = worldObjs[i].defaultTranslation;
    worldObjs[i].rotation = worldObjs[i].defaultRotation;
    worldObjs[i].scale = worldObjs[i].defaultScale;
  }
}

function create_obj_buttons() {
  let container = document.getElementById("obj_buttons");
  let selectedObjSpan = document.getElementById("obj_selected_span");
  for (let i = 0; i < worldObjs.length; i++) {
    let objButton = document.createElement("button");
    objButton.id = worldObjs[i].displayName;
    objButton.onclick = () => {
      selectedObject = worldObjs[i];
      obj_selected_span.textContent = `Selected object: ${selectedObject.displayName}`;
    };
    container.appendChild(objButton);
  }
}

async function initial_render() {
  console.log("Calling initial render");
  let res = await fetch(`${RAAS_LOCATION}/render/`);
  console.log("Initial render responded");
  document.querySelector(".render").src = URL.createObjectURL(await res.blob());
  console.log("Getting initial scene graph");
  g_scene_graph = await get_scene_graph();
  console.log("Loading initial objects/setting defaults");
  g_scene_graph = load_world_objs(g_scene_graph);
  render_world_obj_defaults(worldObjs);
  initial_scene_graph = JSON.parse(JSON.stringify(g_scene_graph));
  console.log("Re-rendering with world obj defaults");
  await re_render(g_scene_graph);
  create_obj_buttons();
  console.log("Re-rendering with world obj defaults complete", g_scene_graph);
}

async function btnClick() {
  let renderButton = document.getElementById("rerender_button");
  renderButton.disabled = true;
  renderButton.textContent = "Rendering...";
  await re_render(g_scene_graph);
  renderButton.textContent = "Re-render";
  renderButton.disabled = false;
}

function toggle_recording() {
  let record_button = document.getElementById("record_button");
  recording = !recording;
  console.log(`now ${!recording ? "not " : ""}recording`);
  record_button.textContent = recording ? "Stop Recording" : "Start Recording";
}

async function render_initial_scene_graph() {
  let renderButton = document.getElementById("rerender_button");
  renderButton.disabled = true;
  renderButton.textContent = "Rendering...";
  await re_render(initial_scene_graph);
  renderButton.textContent = "Re-render";
  renderButton.disabled = false;
}

async function get_scene_graph() {
  const res = await fetch(`${RAAS_LOCATION}/sg/`);
  const scene_graph = await res.json();
  // NOTE: These commands add extra options to configure OSPRay Studio beyond the normal SceneGraph.
  // To modify the camera, you should use these vectors rather than the transformation vectors.
  scene_graph.camera.position = [0.0, 0.0, 1.0];
  scene_graph.camera.up = [0.0, 1.0, 0.0];
  scene_graph.camera.view = [0.0, 0.0, -1.0];

  scene_graph.resolution = "720p"; // This can be a description of the resolution such as 720p, 4K, 8K, etc, or a width by height such as 1920x1080.
  scene_graph.samples_per_pixel = 1; // The number of samples per pixel to use when rendering.
  return scene_graph;
}

async function re_render(scene_graph) {
  console.log("Re-rendering scene");
  const options = {
    body: JSON.stringify(scene_graph),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  };

  const res = await fetch(`${RAAS_LOCATION}/render/`, options);
  document.querySelector(".render").src = URL.createObjectURL(await res.blob());
  console.log("Scene Re-rendered", scene_graph);
}

async function render_movie(key_frames) {
  const options = {
    body: JSON.stringify({
      fps: 10,
      frames: key_frames,
      length: 10,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  };

  var a = document.createElement("a");
  a.style = "display: none";
  document.body.appendChild(a);
  const res = await fetch(`${RAAS_LOCATION}/renderMovie/`, options);
  const json = JSON.stringify(res.body);
  const blob = await res.blob();
  const movie_url = URL.createObjectURL(blob);
  a.href = movie_url;
  a.download = "552 movie.mp4";
  a.click();
  window.URL.revokeObjectURL(movie_url);
  // This approach can be used to download the movie: https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
}

async function update_from_json_editor() {
  const updatedJson = editor.get();
  console.log("Re-rendering scene");
  await re_render(updatedJson);
  console.log("Scene Re-rendered");
}

async function initialize_json_editor() {
  // create the editor
  const container = document.getElementById("jsoneditor");
  const options = {};
  editor = new JSONEditor(container, options);

  // set json
  const initialJson = await get_scene_graph();
  editor.set(initialJson);

  // get json
  const updatedJson = editor.get();
}

function add_movie_keyframe(transformText) {
  movieFrames.push(JSON.parse(JSON.stringify(g_scene_graph)));
  create_keyframe_button(transformText);
}

function create_keyframe_button(transformText) {
  let parent = document.getElementById("keyframes");
  let keyframeButton = document.createElement("button");
  keyframeButton.id = movieFrames.length - 1;
  if (recording) {
    keyframeButton.textContent = transformText;
  } else {
    keyframeButton.textContent = `Keyframe ${movieFrames.length - 1}`;
  }
  keyframeButton.onclick = () => {
    g_scene_graph = JSON.parse(
      JSON.stringify(movieFrames[parseInt(keyframeButton.id)])
    );
    re_render(g_scene_graph);
  };
  parent.appendChild(keyframeButton);
}

async function generate_movie() {
  console.log("Generating movie...");
  const startTime = new Date().getTime();
  let movieButton = document.getElementById("generate_movie_button");
  movieButton.textContent = "Generating movie...";
  movieButton.disabled = true;
  await render_movie(movieFrames);
  movieButton.textContent = "Generate Movie";
  movieButton.disabled = false;
  console.log(
    `Generated and downloaded movie. Took ${
      (new Date().getTime() - startTime) / 1000
    } seconds.`
  );
}

function change_object_position(deltaVec) {
  deltaVec.forEach((dim, i) => (selectedObject.translation[i] += dim));
}

function change_object_scale(deltaScale) {
  for (let i = 0; i < selectedObject.scale.length; i++) {
    selectedObject[i] += deltaScale
  }
}

function change_camera_rotation(xDegrees, yDegrees) {
  const xRadians = degrees_to_radians(xDegrees);
  const yRadians = degrees_to_radians(yDegrees);
  const rotationMatrix = glMatrix.mat4.create();

  // calculates a vector perpendicular to a static 'up' and the camera pos vector
  const perpendicularVec = glMatrix.vec3.create();
  glMatrix.vec3.cross(
    perpendicularVec,
    g_scene_graph.camera.position,
    [0, 1, 0]
  );
  glMatrix.vec3.normalize(perpendicularVec, perpendicularVec);

  // rotate horizontally (about y axis)
  glMatrix.mat4.rotate(rotationMatrix, rotationMatrix, xRadians, [0, 1, 0]);

  // rotate vertically (about vector perpendicular to 'up' (or y axis))
  glMatrix.mat4.rotate(
    rotationMatrix,
    rotationMatrix,
    yRadians,
    perpendicularVec
  );

  // applies rotations to camera
  glMatrix.vec3.transformMat4(
    g_scene_graph.camera.position,
    g_scene_graph.camera.position,
    rotationMatrix
  );

  if (recording) {
    add_movie_keyframe(`Camera rotate: ${xDegrees}° in x, ${yDegrees}° in y`);
  }

  return g_scene_graph;
}

function change_zoom(delta) {
  // get vector from scene_graph.camera.view to scene_graph.camera.position
  const relativeCameraPosition = [
    g_scene_graph.camera.position[0] - g_scene_graph.camera.view[0],
    g_scene_graph.camera.position[1] - g_scene_graph.camera.view[1],
    g_scene_graph.camera.position[2] - g_scene_graph.camera.view[2],
  ];

  const positionNormal = normalize([...relativeCameraPosition]);

  // zoom out by scaling the normalized vec
  for (let i = 0; i < 3; i++) {
    positionNormal[i] *= delta;
    relativeCameraPosition[i] += positionNormal[i];
    g_scene_graph.camera.position[i] =
      g_scene_graph.camera.view[i] + relativeCameraPosition[i];
  }

  if (recording) {
    add_movie_keyframe(
      `Camera zoom ${delta > 0 ? "out" : "in"} of ${delta} units`
    );
  }

  return g_scene_graph;
}

function turn_camera(direction, amount, directionAsString) {
  for (let i = 0; i < 3; i++) {
    g_scene_graph.camera.view[i] += direction[i] * amount * 0.25;
  }
  if (recording) {
    add_movie_keyframe(`Camera turn ${amount} units ${directionAsString}`);
  }
  console.log(g_scene_graph.camera.view);
}

function normalize(vec) {
  const length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);

  vec[0] = vec[0] / length;
  vec[1] = vec[1] / length;
  vec[2] = vec[2] / length;

  return vec;
}

function degrees_to_radians(degrees) {
  return (degrees * Math.PI) / 180;
}
