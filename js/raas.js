// class to interact with scene objects easily
class WorldObject {
  sceneGraphObj = null;

  constructor(
    displayName,
    internalName,
    defaultTranslation = [0, 0, 0],
    defaultRotation = { i: 0, j: 0, k: 0, r: 1 },
    defaultScale = 1
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
  new WorldObject("Tree", "tree_small_02_4k_importer", [0, -2, -10], {i: 0, j: 0, k: 0, r: 1}, 4),
  new WorldObject("Apple", "food_apple_01_4k_importer", [0, 4, -0.3], {i: 0, j: 0, k: 0, r: 1}, 1),
  new WorldObject("Lightbulb", "lightbulb_01_4k_importer", [0, 0, -0.1], {i: 0, j: 0, k: 0, r: 1}, 0),
  new WorldObject("Table", "side_table_tall_01_4k_importer", [0, -1, -0.1], {i: 0, j: 0, k: 0, r: 1}, 1),
  new WorldObject("Bust", "marble_bust_01_4k_importer", [0, -0.3, -0.1], {i: 0, j: 0, k: 0, r: 1}, 1),
];
var selectedObject = null;

// associates the scene objects in the scene_graph with WorldObject objects
function load_world_objs(scene_graph) {
  for (i = 0; i < scene_graph.world.children.length; i++) {
    if (scene_graph.world.children[i].type === "IMPORTER") {
      let worldObj = worldObjs.find(
        (worldObj) =>
          worldObj.internalName === scene_graph.world.children[i].name
      );
      worldObj.sceneGraphObj = scene_graph.world.children[i];
    }
  }
}

// sets default values on scene_graph objects
function render_world_obj_defaults(worldObjs) {
  initial = JSON.stringify(g_scene_graph)
  for (let i = 0; i < worldObjs.length; i++) {
    worldObjs[i].translation = worldObjs[i].defaultTranslation;
    worldObjs[i].rotation = worldObjs[i].defaultRotation;
    worldObjs[i].scale = worldObjs[i].defaultScale;
  }
}

// sets the currently-selected object. object transformations are applied to this object
function select_object(option) {
  let i;
  for (i = 0; i < worldObjs.length; i++) {
    if (worldObjs[i].displayName === option.value)
      break;
  }
  selectedObject = worldObjs[i];
}

// populates the Object dropdown with the scene_graph objects
function create_obj_options() {
  let container = document.getElementById("obj_options");
  for (let i = 0; i < worldObjs.length; i++) {
    let objOption = document.createElement("option");
    objOption.id = worldObjs[i].displayName;
    objOption.textContent = worldObjs[i].displayName;
    container.appendChild(objOption);
  }
}

async function initial_render() {

  console.log("Getting initial scene graph");
  g_scene_graph = await get_scene_graph();
  console.log("Loading initial objects/setting defaults");
  load_world_objs(g_scene_graph);


  render_world_obj_defaults(worldObjs);
  initial_scene_graph = JSON.parse(JSON.stringify(g_scene_graph));
  
  console.log("Rendering with world obj defaults");
  await re_render(g_scene_graph);
  create_obj_options();
  console.log("Rendering with world obj defaults complete", g_scene_graph);
}

// disables re-render button while re-rendering
async function handle_re_render() {
  let renderButton = document.getElementById("rerender_button");
  renderButton.disabled = true;
  renderButton.textContent = "Rendering...";
  await re_render(g_scene_graph);
  renderButton.textContent = "Re-render";
  renderButton.disabled = false;
}

// if recording, all camera/object movements generate their own keyframe
function toggle_recording() {
  let record_button = document.getElementById("record_button");
  recording = !recording;
  console.log(`now ${!recording ? "not " : ""}recording`);
  record_button.textContent = recording ? "Stop Recording" : "Start Recording";
}

// used to revert render to initial scene graph
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

  scene_graph.camera.position = [0.0, 0.0, 3.0];
  scene_graph.camera.up = [0.0, 1.0, 0.0];
  scene_graph.camera.view = [0.0, 0.0, -1.0];

  scene_graph.resolution = "720p";
  scene_graph.samples_per_pixel = 1; 
  return scene_graph;
}

async function re_render(scene_graph) {
  console.log("Re-rendering scene with scene graph: ", scene_graph);
  const options = {
    body: JSON.stringify(scene_graph),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  };

  const res = await fetch(`${RAAS_LOCATION}/render/`, options);
  document.querySelector(".render").src = URL.createObjectURL(await res.blob());
  console.log("Scene Re-rendered", scene_graph);
}

async function render_movie(key_frames, fps, length) {
  const options = {
    body: JSON.stringify({
      fps: fps,
      frames: key_frames,
      length: length,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  };

  // renders and downloads movie
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
}

// copies the current scene_graph to a movie keyframe
function add_movie_keyframe(transformText) {
  movieFrames.push(JSON.parse(JSON.stringify(g_scene_graph)));
  create_keyframe_button(transformText);
}

// creates a button for a movie keyframe. clicking the button returns you to that scenegraph/render
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

  let fps = document.getElementById("movie_fps").value
  let length = document.getElementById("movie_length").value
  await render_movie(movieFrames, fps, length);


  movieButton.textContent = "Generate Movie";
  movieButton.disabled = false;
  console.log(
    `Generated and downloaded movie. Took ${(new Date().getTime() - startTime) / 1000
    } seconds.`
  );
}
