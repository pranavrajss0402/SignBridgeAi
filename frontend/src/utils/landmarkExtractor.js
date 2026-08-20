// SIGNOVA - Hand Landmark Extraction
// Must match the Python Bi-LSTM training input.
//
// Left hand  = 21 landmarks × 3 = 63
// Right hand = 21 landmarks × 3 = 63
// Total      = 126 features per frame

export function extractUnifiedLandmarks(
  faceResult,
  handResult,
  poseResult
) {
  const leftHand = new Array(63).fill(0);
  const rightHand = new Array(63).fill(0);

  if (
    handResult?.landmarks &&
    handResult?.handedness
  ) {
    for (
      let i = 0;
      i < handResult.landmarks.length && i < 2;
      i++
    ) {
      const landmarks = handResult.landmarks[i];

      if (!landmarks || landmarks.length !== 21) {
        continue;
      }

      const label =
        handResult.handedness[i]?.[0]?.categoryName?.toLowerCase();

      const values = [];

      for (const point of landmarks) {
        values.push(point.x);
        values.push(point.y);
        values.push(point.z ?? 0);
      }

      if (values.length !== 63) {
        continue;
      }

      if (label === "left") {
        leftHand.splice(0, 63, ...values);
      } else if (label === "right") {
        rightHand.splice(0, 63, ...values);
      }
    }
  }

  return new Float32Array([
    ...leftHand,
    ...rightHand
  ]);
}