const RAAS_LOCATION = "http://3.145.40.172";
var editor = null;
var scene_graph = get_scene_graph();

async function initial_render() {
  let res = await fetch(`${RAAS_LOCATION}/render/`);
  document.querySelector(".render").src = URL.createObjectURL(await res.blob());
}

async function btnClick() {
  const graph = await get_scene_graph();
  console.log(graph);
  await re_render(graph);
}

async function get_scene_graph() {
  const res = await fetch(`${RAAS_LOCATION}/sg/`);
  const scene_graph = await res.json();
  // NOTE: These commands add extra options to configure OSPRay Studio beyond the normal SceneGraph.
  // To modify the camera, you should use these vectors rather than the transformation vectors.
  scene_graph.camera.position = [0.5, 0.0, 1.0];
  scene_graph.camera.up = [0.0, 1.0, 0.0];
  scene_graph.camera.view = [-0.6, 0.0, -1.0];

  scene_graph.resolution = "720p"; // This can be a description of the resolution such as 720p, 4K, 8K, etc, or a width by height such as 1920x1080.
  scene_graph.samples_per_pixel = 1; // The number of samples per pixel to use when rendering.

  return scene_graph;
}

async function re_render(scene_graph) {
  const options = {
    body: JSON.stringify(scene_graph),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  };

  const res = await fetch(`${RAAS_LOCATION}/render/`, options);
  document.querySelector(".render").src = URL.createObjectURL(await res.blob());
}

async function render_movie(key_frames) {
  console.log("STARTING MOVIE");
  const options = {
    body: JSON.stringify({
      fps: 10,
      frames: key_frames,
      length: 5,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  };
  console.log("MADE OPTIONS/FETCHING");

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

function update_from_json_editor() {
  const updatedJson = editor.get();
  re_render(updatedJson);
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

async function generate_test_movie() {
  scene_graph = await get_scene_graph();
  // parse/serialize is a quick way to get a deep copy of an object
  const scene_graphs = [JSON.parse(JSON.stringify(scene_graph))];
  for (let i = 0; i < 10; i++) {
    scene_graph.camera.position[0] += 0.25;
    // await re_render(scene_graph);
    scene_graphs.push(JSON.parse(JSON.stringify(scene_graph)));
  }
  console.log(scene_graphs);
  render_movie(scene_graphs);
}
