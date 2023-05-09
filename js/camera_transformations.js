
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
}


/* UTILITIES */
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
  