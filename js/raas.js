const RAAS_LOCATION = "http://3.145.40.172";
var editor = null;
var scene_graph = get_scene_graph();

async function initial_render() {
  let res = await fetch(`${RAAS_LOCATION}/render/`);
  document.querySelector(".render").src = URL.createObjectURL(await res.blob());
}

function btnClick() {
  get_scene_graph().then((scene_graph) => {
    console.log(scene_graph);
    re_render(scene_graph);
  });
}

function get_scene_graph() {
  return fetch(`${RAAS_LOCATION}/sg/`)
    .then((response) => response.json())
    .then((scene_graph) => {
      // NOTE: These commands add extra options to configure OSPRay Studio beyond the normal SceneGraph.
      // To modify the camera, you should use these vectors rather than the transformation vectors.
      scene_graph.camera.position = [0.5, 0.0, 1.0];
      scene_graph.camera.up = [0.0, 1.0, 0.0];
      scene_graph.camera.view = [-0.6, 0.0, -1.0];

      scene_graph.resolution = "720p"; // This can be a description of the resolution such as 720p, 4K, 8K, etc, or a width by height such as 1920x1080.
      scene_graph.samples_per_pixel = 1; // The number of samples per pixel to use when rendering.

      return scene_graph;
    });
}

function re_render(scene_graph) {
  const options = {
    body: JSON.stringify(scene_graph),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  };

  fetch(`${RAAS_LOCATION}/render/`, options)
    .then((response) => response.blob())
    .then((blob) => {
      document.querySelector(".render").src = URL.createObjectURL(blob);
    });
}

function render_movie(key_frames) {
  const options = {
    body: JSON.stringify({
      fps: 10,
      frames: key_frames,
      length: 2,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  };

  fetch(`${RAAS_LOCATION}/renderMovie/`, options)
    .then((response) => response.blob())
    .then((blob) => {
      const movie_url = URL.createObjectURL(blob);
      // This approach can be used to download the movie: https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
    });
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

// function generate_test_movie() {
// 	scene_graph =
// }
