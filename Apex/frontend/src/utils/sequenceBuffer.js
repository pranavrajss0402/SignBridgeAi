// SIGNOVA - Temporal Sequence Buffer
// Stores landmark feature vectors across multiple frames.

export class SequenceBuffer {
  constructor(sequenceLength = 30) {
    this.sequenceLength = sequenceLength;
    this.buffer = [];
  }

  // Add one frame of features
  add(features) {
    if (!features) return;

    this.buffer.push(
      Array.from(features)
    );

    // Keep only the latest N frames
    if (this.buffer.length > this.sequenceLength) {
      this.buffer.shift();
    }
  }

  // Number of frames currently stored
  get length() {
    return this.buffer.length;
  }

  // Check whether 30 frames are available
  isFull() {
    return this.buffer.length === this.sequenceLength;
  }

  // Get complete sequence
  getSequence() {
    if (!this.isFull()) {
      return null;
    }

    return this.buffer.map(
      (frame) => [...frame]
    );
  }

  // Clear sequence
  clear() {
    this.buffer = [];
  }
}