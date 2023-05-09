function change_object_position(deltaVec) {
deltaVec.forEach((dim, i) => (selectedObject.translation[i] += dim));

if (recording) {
    add_movie_keyframe(`Object translate: ${selectedObject.displayName} [${deltaVec[0]},${deltaVec[1]},${deltaVec[2]}]`);
}
}

function change_object_scale(deltaScale) {
for (let i = 0; i < selectedObject.scale.length; i++) {
    selectedObject.scale[i] += deltaScale
}

if (recording) {
    add_movie_keyframe(`Object scale: ${selectedObject.displayName} by ${deltaScale}`);
}
}
  

function change_object_rotation(deltaVec) {
let {i, j, k, r} = selectedObject.rotation;
selectedObject.rotation = {
    i: i + deltaVec[0],
    j: j + deltaVec[1],
    k: k + deltaVec[2],
    r: r + deltaVec[3],
}

if (recording) {
    add_movie_keyframe(`Object rotate: ${selectedObject.displayName} {i:${deltaVec[0]},j:${deltaVec[1]},k:${deltaVec[2]}}`);
}
}