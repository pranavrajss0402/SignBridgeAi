import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Play, Pause, RotateCcw, Settings, Info } from "lucide-react";
import "./AvatarPanel.css";

// ── Full ANIMATION_MAP: covers all dataset phrases + Quick Phrase buttons ─────
// Maps every label_encoder phrase → best available GLB animation
const ANIMATION_MAP = {
  // === GREETINGS & PLEASANTRIES ===
  "hi how are you":               "hello_nomesh.glb",
  "how are you":                  "hello_nomesh.glb",
  "hi":                           "hello_nomesh.glb",
  "hello":                        "hello_nomesh.glb",
  "nice to meet you":             "hello_nomesh.glb",
  "how are things":               "hello_nomesh.glb",
  "you are welcome":              "hello_nomesh.glb",
  "congratulations":              "hello_nomesh.glb",
  "it was nice chatting with you":"hello_nomesh.glb",
  "thank you so much":            "hello_nomesh.glb",
  "that is so kind of you":       "hello_nomesh.glb",

  // === THANK YOU ===
  "thank you":                    "hello_nomesh.glb",
  "thanks":                       "hello_nomesh.glb",
  "thank":                        "hello_nomesh.glb",
  "i am fine thank you sir":      "hello_nomesh.glb",
  "i am fine. thank you sir":     "hello_nomesh.glb",

  // === YES / AFFIRMATIONS ===
  "yes":                          "i_love_you.glb",
  "yeah":                         "i_love_you.glb",
  "yep":                          "i_love_you.glb",
  "sure":                         "i_love_you.glb",
  "okay":                         "i_love_you.glb",
  "ok":                           "i_love_you.glb",
  "alright":                      "i_love_you.glb",
  "correct":                      "i_love_you.glb",

  // === GOOD ===
  "good":                         "i_love_you.glb",
  "great":                        "i_love_you.glb",
  "wonderful":                    "i_love_you.glb",
  "excellent":                    "i_love_you.glb",
  "well done":                    "i_love_you.glb",
  "very good":                    "i_love_you.glb",
  "good morning":                 "hello_nomesh.glb",
  "good afternoon":               "hello_nomesh.glb",
  "good evening":                 "hello_nomesh.glb",
  "good night":                   "hello_nomesh.glb",

  // === HELP / CARE ===
  "how can i help you":           "help.glb",
  "can i help you":               "help.glb",
  "help me":                      "help.glb",
  "i can not help you there":     "help.glb",
  "help":                         "help.glb",
  "take care of yourself":        "care.glb",
  "we are all with you":          "care.glb",
  "care":                         "care.glb",

  // === LOVE / EMOTIONS ===
  "i like you i love you":        "i_love_you.glb",
  "love":                         "i_love_you.glb",
  "i like it":                    "i_love_you.glb",
  "i do not like it":             "no.glb",
  "i really appreciate it":       "i_love_you.glb",

  // === APOLOGIES / SORRY ===
  "i am so sorry to hear that":   "apologize.glb",
  "sorry":                        "apologize.glb",
  "do not worry":                 "apologize.glb",
  "i am not really sure":         "apologize.glb",
  "apologize":                    "apologize.glb",

  // === NO / NEGATIVE ===
  "no":                           "no.glb",
  "i do not agree":               "no.glb",
  "i do not mean it":             "no.glb",
  "do not abuse him":             "no.glb",
  "do not be stubborn":           "no.glb",
  "do not hurt me":               "no.glb",
  "do not make me angry":         "no.glb",
  "do not take it to the heart":  "no.glb",
  "you are bad":                  "no.glb",
  "now onwards he will never hurt you": "no.glb",

  // === PLEASE / REQUEST ===
  "can you repeat that please":   "plead.glb",
  "please":                       "plead.glb",
  "do me a favour":               "plead.glb",
  "could you please talk slower": "plead.glb",
  "plead":                        "plead.glb",

  // === I / ME ===
  "i":                            "i_me.glb",
  "me":                           "i_me.glb",
  "i am (age)":                   "i_me.glb",
  "my name is xxxxxxxx":          "i_me.glb",
  "i promise":                    "i_me.glb",
  "i somehow got to know about it": "i_me.glb",
  "i was stopped by some one":    "i_me.glb",
  "i am really grateful":         "i_me.glb",
  "i am in dilemma what to do":   "i_me.glb",

  // === FEELINGS ===
  "i am very happy":              "i_love_you.glb",
  "i am crying":                  "apologize.glb",
  "i am afraid of that":          "no.glb",
  "i am feeling bored":           "no.glb",
  "i am feeling cold":            "no.glb",
  "i am hungry":                  "plead.glb",
  "i am tired":                   "no.glb",
  "i am suffering from fever":    "apologize.glb",
  "i got hurt":                   "no.glb",
  "i enjoyed a lot":              "i_love_you.glb",
  "i am fine thank you sir":      "hello_nomesh.glb",
  "i am fine. thank you sir":     "hello_nomesh.glb",
  "i am sitting in the class":    "child.glb",

  // === KNOW / UNDERSTAND ===
  "dont know":                    "dont_know.glb",
  "i do not care":                "dont_know.glb",
  "you do anything, i do not care": "dont_know.glb",
  "it does not make any difference to me": "dont_know.glb",
  "how can i trust you":          "dont_know.glb",
  "try to understand":            "dont_know.glb",
  "are you hiding something":     "dont_know.glb",
  "know":                         "dont_know.glb",

  // === ACTIONS / MOVEMENT ===
  "fall down":                    "fall_down.glb",
  "fall":                         "fall_down.glb",
  "go and sleep":                 "fall_down.glb",
  "shall we go outside":          "fall_down.glb",
  "continue":                     "continue_sign.glb",
  "he came by train":             "continue_sign.glb",
  "he is on the way":             "continue_sign.glb",
  "he would be coming today":     "continue_sign.glb",
  "when will the train leave":    "continue_sign.glb",
  "wear the shirt":               "continue_sign.glb",
  "comb your hair":               "continue_sign.glb",

  // === WATER / FOOD / DAILY ===
  "bring water for me":           "cup.glb",
  "i need water":                 "cup.glb",
  "pour some more water into the glass": "cup.glb",
  "had your food":                "cup.glb",
  "cup":                          "cup.glb",
  "cut":                          "cut.glb",

  // === QUESTIONS ===
  "what are you doing":           "dont_know.glb",
  "what did you tell him":        "dont_know.glb",
  "what do you do":               "dont_know.glb",
  "what do you think":            "dont_know.glb",
  "what do you want to become":   "dont_know.glb",
  "what happened":                "dont_know.glb",
  "what is your phone number":    "dont_know.glb",
  "what you want":                "dont_know.glb",
  "where are you from":           "dont_know.glb",
  "who are you":                  "dont_know.glb",
  "how old are you":              "dont_know.glb",
  "how dare you":                 "dont_know.glb",
  "are you free today":           "dont_know.glb",
  "do you need something":        "plead.glb",
  "which collegeschool are you from": "dont_know.glb",

  // === PEOPLE / RELATIONSHIPS ===
  "he she is my friend":          "hello_nomesh.glb",
  "he is going into the room":    "continue_sign.glb",
  "let him take time":            "care.glb",

  // === POSITIVE AFFIRMATIONS ===
  "you are good":                 "i_love_you.glb",
  "you can do it":                "i_love_you.glb",
  "you need a medicine, take this one": "care.glb",
  "why are you angry":            "no.glb",
  "why are you crying":           "apologize.glb",
  "why are you disappointed":     "apologize.glb",

  // === OTHERS ===
  "this place is beautiful":      "flower.glb",
  "flower":                       "flower.glb",
  "dog":                          "dog.glb",
  "deaf":                         "deaf.glb",
  "data":                         "data.glb",
  "child":                        "child.glb",
  "speak softly":                 "plead.glb",
  "turn on light turn off light": "continue_sign.glb",
  "tell me truth":                "i_me.glb",
  "serve the food":               "cup.glb",
  "prepare the bed":              "fall_down.glb",
};

// ── Unified Animation Source Bone → Mixamo Avatar Bone Map ──────────────────
// Maps both UE5 (MetaHuman) and SMPLX bone names to the avatar.glb skeleton names
const BONE_MAPPING = {
  // === SPINE / PELVIS ===
  "pelvis":               "mixamorig_Hips_01",
  "root":                 "mixamorig_Hips_01",
  "spine_01":             "mixamorig_Spine_02",
  "spine1":               "mixamorig_Spine_02",
  "spine_02":             "mixamorig_Spine1_03",
  "spine2":               "mixamorig_Spine1_03",
  "spine_03":             "mixamorig_Spine2_04",
  "spine3":               "mixamorig_Spine2_04",
  "spine_04":             "mixamorig_Spine2_04",
  "spine_05":             "mixamorig_Spine2_04",
  "neck_01":              "mixamorig_Neck_05",
  "neck_02":              "mixamorig_Neck_05",
  "neck":                 "mixamorig_Neck_05",
  "head":                 "mixamorig_Head_06",

  // === LEFT ARM ===
  "clavicle_l":           "mixamorig_LeftShoulder_08",
  "left_collar":          "mixamorig_LeftShoulder_08",
  "upperarm_l":           "mixamorig_LeftArm_09",
  "left_shoulder":        "mixamorig_LeftArm_09",
  "lowerarm_l":           "mixamorig_LeftForeArm_010",
  "left_elbow":           "mixamorig_LeftForeArm_010",
  "hand_l":               "mixamorig_LeftHand_011",
  "left_wrist":           "mixamorig_LeftHand_011",

  // === LEFT FINGERS ===
  "thumb_01_l":           "mixamorig_LeftHandThumb1_012",
  "left_thumb1":          "mixamorig_LeftHandThumb1_012",
  "thumb_02_l":           "mixamorig_LeftHandThumb2_013",
  "left_thumb2":          "mixamorig_LeftHandThumb2_013",
  "thumb_03_l":           "mixamorig_LeftHandThumb3_014",
  "left_thumb3":          "mixamorig_LeftHandThumb3_014",

  "index_metacarpal_l":   "mixamorig_LeftHandIndex1_016",
  "index_01_l":           "mixamorig_LeftHandIndex1_016",
  "left_index1":          "mixamorig_LeftHandIndex1_016",
  "index_02_l":           "mixamorig_LeftHandIndex2_017",
  "left_index2":          "mixamorig_LeftHandIndex2_017",
  "index_03_l":           "mixamorig_LeftHandIndex3_018",
  "left_index3":          "mixamorig_LeftHandIndex3_018",

  "middle_metacarpal_l":  "mixamorig_LeftHandMiddle1_020",
  "middle_01_l":          "mixamorig_LeftHandMiddle1_020",
  "left_middle1":         "mixamorig_LeftHandMiddle1_020",
  "middle_02_l":          "mixamorig_LeftHandMiddle2_021",
  "left_middle2":         "mixamorig_LeftHandMiddle2_021",
  "middle_03_l":          "mixamorig_LeftHandMiddle3_022",
  "left_middle3":         "mixamorig_LeftHandMiddle3_022",

  "ring_metacarpal_l":    "mixamorig_LeftHandRing1_024",
  "ring_01_l":            "mixamorig_LeftHandRing1_024",
  "left_ring1":           "mixamorig_LeftHandRing1_024",
  "ring_02_l":            "mixamorig_LeftHandRing2_025",
  "left_ring2":           "mixamorig_LeftHandRing2_025",
  "ring_03_l":            "mixamorig_LeftHandRing3_026",
  "left_ring3":           "mixamorig_LeftHandRing3_026",

  "pinky_metacarpal_l":   "mixamorig_LeftHandPinky1_028",
  "pinky_01_l":           "mixamorig_LeftHandPinky1_028",
  "left_pinky1":          "mixamorig_LeftHandPinky1_028",
  "pinky_02_l":           "mixamorig_LeftHandPinky2_029",
  "left_pinky2":          "mixamorig_LeftHandPinky2_029",
  "pinky_03_l":           "mixamorig_LeftHandPinky3_030",
  "left_pinky3":          "mixamorig_LeftHandPinky3_030",

  // === RIGHT ARM ===
  "clavicle_r":           "mixamorig_RightShoulder_032",
  "right_collar":         "mixamorig_RightShoulder_032",
  "upperarm_r":           "mixamorig_RightArm_033",
  "right_shoulder":       "mixamorig_RightArm_033",
  "lowerarm_r":           "mixamorig_RightForeArm_034",
  "right_elbow":          "mixamorig_RightForeArm_034",
  "hand_r":               "mixamorig_RightHand_035",
  "right_wrist":          "mixamorig_RightHand_035",

  // === RIGHT FINGERS ===
  "thumb_01_r":           "mixamorig_RightHandThumb1_036",
  "right_thumb1":         "mixamorig_RightHandThumb1_036",
  "thumb_02_r":           "mixamorig_RightHandThumb2_037",
  "right_thumb2":         "mixamorig_RightHandThumb2_037",
  "thumb_03_r":           "mixamorig_RightHandThumb3_038",
  "right_thumb3":         "mixamorig_RightHandThumb3_038",

  "index_metacarpal_r":   "mixamorig_RightHandIndex1_040",
  "index_01_r":           "mixamorig_RightHandIndex1_040",
  "right_index1":         "mixamorig_RightHandIndex1_040",
  "index_02_r":           "mixamorig_RightHandIndex2_041",
  "right_index2":         "mixamorig_RightHandIndex2_041",
  "index_03_r":           "mixamorig_RightHandIndex3_042",
  "right_index3":         "mixamorig_RightHandIndex3_042",

  "middle_metacarpal_r":  "mixamorig_RightHandMiddle1_044",
  "middle_01_r":          "mixamorig_RightHandMiddle1_044",
  "right_middle1":        "mixamorig_RightHandMiddle1_044",
  "middle_02_r":          "mixamorig_RightHandMiddle2_045",
  "right_middle2":        "mixamorig_RightHandMiddle2_045",
  "middle_03_r":          "mixamorig_RightHandMiddle3_046",
  "right_middle3":        "mixamorig_RightHandMiddle3_046",

  "ring_metacarpal_r":    "mixamorig_RightHandRing1_048",
  "ring_01_r":            "mixamorig_RightHandRing1_048",
  "right_ring1":          "mixamorig_RightHandRing1_048",
  "ring_02_r":            "mixamorig_RightHandRing2_049",
  "right_ring2":          "mixamorig_RightHandRing2_049",
  "ring_03_r":            "mixamorig_RightHandRing3_050",
  "right_ring3":          "mixamorig_RightHandRing3_050",

  "pinky_metacarpal_r":   "mixamorig_RightHandPinky1_052",
  "pinky_01_r":           "mixamorig_RightHandPinky1_052",
  "right_pinky1":         "mixamorig_RightHandPinky1_052",
  "pinky_02_r":           "mixamorig_RightHandPinky2_053",
  "right_pinky2":         "mixamorig_RightHandPinky2_053",
  "pinky_03_r":           "mixamorig_RightHandPinky3_054",
  "right_pinky3":         "mixamorig_RightHandPinky3_054",

  // === LEGS ===
  "thigh_l":              "mixamorig_LeftUpLeg_055",
  "left_hip":             "mixamorig_LeftUpLeg_055",
  "calf_l":               "mixamorig_LeftLeg_056",
  "left_knee":            "mixamorig_LeftLeg_056",
  "foot_l":               "mixamorig_LeftFoot_057",
  "left_foot":            "mixamorig_LeftFoot_057",
  "left_ankle":           "mixamorig_LeftFoot_057",
  "ball_l":               "mixamorig_LeftToeBase_058",

  "thigh_r":              "mixamorig_RightUpLeg_060",
  "right_hip":            "mixamorig_RightUpLeg_060",
  "calf_r":               "mixamorig_RightLeg_061",
  "right_knee":           "mixamorig_RightLeg_061",
  "foot_r":               "mixamorig_RightFoot_062",
  "right_foot":           "mixamorig_RightFoot_062",
  "right_ankle":          "mixamorig_RightFoot_062",
  "ball_r":               "mixamorig_RightToeBase_063",

  // Twist bones / helper bones remapping
  "lowerarm_twist_01_l":  "mixamorig_LeftForeArm_010",
  "lowerarm_twist_02_l":  "mixamorig_LeftForeArm_010",
  "upperarm_twist_01_l":  "mixamorig_LeftArm_09",
  "upperarm_twist_02_l":  "mixamorig_LeftArm_09",
  "lowerarm_twist_01_r":  "mixamorig_RightForeArm_034",
  "lowerarm_twist_02_r":  "mixamorig_RightForeArm_034",
  "upperarm_twist_01_r":  "mixamorig_RightArm_033",
  "upperarm_twist_02_r":  "mixamorig_RightArm_033",
  "thigh_twist_01_l":     "mixamorig_LeftUpLeg_055",
  "thigh_twist_02_l":     "mixamorig_LeftUpLeg_055",
  "calf_twist_01_l":      "mixamorig_LeftLeg_056",
  "calf_twist_02_l":      "mixamorig_LeftLeg_056",
  "thigh_twist_01_r":     "mixamorig_RightUpLeg_060",
  "thigh_twist_02_r":     "mixamorig_RightUpLeg_060",
  "calf_twist_01_r":      "mixamorig_RightLeg_061",
  "calf_twist_02_r":      "mixamorig_RightLeg_061",
  "wrist_l":              "mixamorig_LeftHand_011",
  "wrist_r":              "mixamorig_RightHand_035",
};

// Hand bones list remains same
const HAND_BONE_NAMES = [
  "mixamorig_LeftHand_011",
  "mixamorig_LeftHandThumb1_012","mixamorig_LeftHandThumb2_013","mixamorig_LeftHandThumb3_014",
  "mixamorig_LeftHandIndex1_016","mixamorig_LeftHandIndex2_017","mixamorig_LeftHandIndex3_018",
  "mixamorig_LeftHandMiddle1_020","mixamorig_LeftHandMiddle2_021","mixamorig_LeftHandMiddle3_022",
  "mixamorig_LeftHandRing1_024","mixamorig_LeftHandRing2_025","mixamorig_LeftHandRing3_026",
  "mixamorig_LeftHandPinky1_028","mixamorig_LeftHandPinky2_029","mixamorig_LeftHandPinky3_030",
  "mixamorig_RightHand_035",
  "mixamorig_RightHandThumb1_036","mixamorig_RightHandThumb2_037","mixamorig_RightHandThumb3_038",
  "mixamorig_RightHandIndex1_040","mixamorig_RightHandIndex2_041","mixamorig_RightHandIndex3_042",
  "mixamorig_RightHandMiddle1_044","mixamorig_RightHandMiddle2_045","mixamorig_RightHandMiddle3_046",
  "mixamorig_RightHandRing1_048","mixamorig_RightHandRing2_049","mixamorig_RightHandRing3_050",
  "mixamorig_RightHandPinky1_052","mixamorig_RightHandPinky2_053","mixamorig_RightHandPinky3_054",
];

// Keep placeholders for backwards compatibility
const TORSO_MAP   = {};
const ARMS_MAP    = {};
const WRISTS_MAP  = {};
const FINGERS_MAP = {};




export default function AvatarPanel({ text = "", isActive = true }) {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLevel, setDebugLevel] = useState(4); // 0-4
  const [status, setStatus] = useState("Initializing Three.js...");
  const [subtitles, setSubtitles] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Three.js instances
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const clockRef = useRef(null);
  const mixerRef = useRef(null);
  const avatarMeshRef = useRef(null);
  const avatarSkinnedMeshRef = useRef(null);
  const restPoseRef = useRef({});
  const currentActionRef = useRef(null);
  const animActionsRef = useRef({});
  const animationFrameIdRef = useRef(null);
  const boneRootRef = useRef(null); // The actual skeleton root bone for AnimationMixer
  
  // Animation sequencing queue refs
  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);
  const onAnimationFinishedRef = useRef(null);

  // Load a model's default rest pose
  const saveRestPose = (root) => {
    const poses = {};
    root.traverse((obj) => {
      if (obj.isBone || obj.type === "Object3D") {
        poses[obj.name] = {
          quaternion: obj.quaternion.clone(),
          position: obj.position.clone(),
        };
      }
    });
    restPoseRef.current = poses;
  };

  const restoreRestPose = (root) => {
    root.traverse((obj) => {
      const rest = restPoseRef.current[obj.name];
      if (rest) {
        obj.quaternion.copy(rest.quaternion);
        obj.position.copy(rest.position);
      }
    });
    root.updateMatrixWorld(true);
  };

  // Mathematically correct runtime retargeting logic from friend's prototype
  const retargetAnimation = (sourceGLTF, targetAvatar, level) => {
    if (!sourceGLTF.animations || sourceGLTF.animations.length === 0) {
      throw new Error("Source animation GLB has no tracks.");
    }

    const sourceClip = sourceGLTF.animations[0];
    const sourceScene = sourceGLTF.scene;

    // Clean rest poses
    restoreRestPose(targetAvatar);
    sourceScene.updateMatrixWorld(true);
    targetAvatar.updateMatrixWorld(true);

    // Build active bone map — always use full UE5→Mixamo table
    const boneMap = { ...BONE_MAPPING };


    const newTracks = [];

    // Capture rest quaternions
    const srcRestLocal = {};
    const srcRestWorld = {};
    sourceScene.traverse((obj) => {
      if (obj.isBone || obj.type === "Object3D") {
        srcRestLocal[obj.name] = obj.quaternion.clone();
        const wq = new THREE.Quaternion();
        obj.getWorldQuaternion(wq);
        srcRestWorld[obj.name] = wq;
      }
    });

    const tgtRestLocal = {};
    const tgtRestWorld = {};
    targetAvatar.traverse((obj) => {
      if (obj.isBone || obj.type === "Object3D") {
        tgtRestLocal[obj.name] = obj.quaternion.clone();
        const wq = new THREE.Quaternion();
        obj.getWorldQuaternion(wq);
        tgtRestWorld[obj.name] = wq;
      }
    });

    for (const [srcName, tgtName] of Object.entries(boneMap)) {
      if (tgtName === "mixamorig_Hips_01") continue; // Keep avatar standing upright

      const sb = sourceScene.getObjectByName(srcName);
      const tb = targetAvatar.getObjectByName(tgtName);

      if (!sb || !tb) continue;

      const Ws_rest = srcRestWorld[srcName];
      const Wt_rest = tgtRestWorld[tgtName];

      const C_bone = Wt_rest.clone().invert().multiply(Ws_rest);
      const C_bone_inv = C_bone.clone().invert();

      const Qs_rest_local = srcRestLocal[srcName];
      const Qt_rest_local = tgtRestLocal[tgtName];

      const track = sourceClip.tracks.find((t) => t.name === `${srcName}.quaternion`);
      if (!track) continue;

      const times = track.times.slice();
      const values = new Float32Array(track.values.length);

      for (let i = 0; i < times.length; i++) {
        const i4 = i * 4;
        const Qs_anim_local = new THREE.Quaternion(
          track.values[i4],
          track.values[i4 + 1],
          track.values[i4 + 2],
          track.values[i4 + 3]
        );

        const Qs_delta_local = Qs_rest_local.clone().invert().multiply(Qs_anim_local);
        const converted_local_delta = C_bone.clone().multiply(Qs_delta_local).multiply(C_bone_inv);
        const Qt_anim_local = Qt_rest_local.clone().multiply(converted_local_delta);

        values[i4] = Qt_anim_local.x;
        values[i4 + 1] = Qt_anim_local.y;
        values[i4 + 2] = Qt_anim_local.z;
        values[i4 + 3] = Qt_anim_local.w;
      }

      newTracks.push(new THREE.QuaternionKeyframeTrack(`${tgtName}.quaternion`, times, values));
    }

    return new THREE.AnimationClip(`retargeted_lvl${level}`, sourceClip.duration, newTracks);
  };

  // Initialize ThreeJS Scene
  useEffect(() => {
    if (!mountRef.current) return;
    let cleanupFns = [];

    // ── RAF defers init until the container is actually painted ──
    const rafId = requestAnimationFrame(() => {
      if (!mountRef.current) return;
      setStatus("Loading 3D Scene...");

      const width  = mountRef.current.offsetWidth  || 500;
      const height = mountRef.current.offsetHeight || 400;

      // 1. Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8fafc);
      sceneRef.current = scene;

      // 2. Camera — wide-angle to see full-body during high arm animations
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
      camera.position.set(0, 1.1, 2.5);
      cameraRef.current = camera;

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 4. Lights — bright enough to show the dark Mixamo avatar mesh
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb0c4de, 2.5);
      hemiLight.position.set(0, 20, 0);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
      dirLight.position.set(3, 10, 5);
      dirLight.castShadow = true;
      dirLight.shadow.camera.top    =  3;
      dirLight.shadow.camera.bottom = -3;
      dirLight.shadow.camera.left   = -3;
      dirLight.shadow.camera.right  =  3;
      dirLight.shadow.camera.near   =  0.1;
      dirLight.shadow.camera.far    =  40;
      scene.add(dirLight);

      // Fill light from front-left to remove harsh shadows
      const fillLight = new THREE.DirectionalLight(0xd0eeff, 1.5);
      fillLight.position.set(-3, 5, 3);
      scene.add(fillLight);

      // Backlight rim for depth
      const rimLight = new THREE.PointLight(0xffeedd, 1.2, 10);
      rimLight.position.set(0, 2.5, -2);
      scene.add(rimLight);

      // Tone mapping for better PBR material rendering
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Grid Floor
      const gridHelper = new THREE.GridHelper(10, 20, 0x0ea5e9, 0xe2e8f0);
      gridHelper.position.y = 0;
      scene.add(gridHelper);

      // 5. Orbit Controls — target waist level so full body fits in frame
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping   = true;
      controls.dampingFactor   = 0.05;
      controls.maxPolarAngle   = Math.PI / 2 + 0.1;
      controls.target.set(0, 0.9, 0);
      controls.update();
      controlsRef.current = controls;

      clockRef.current = new THREE.Clock();

      // 6. Load Avatar GLB
      const loader = new GLTFLoader();
      setStatus("Loading 3D Avatar...");
      setIsLoading(true);

      loader.load(
        "/avatar/model/avatar.glb",
        (gltf) => {
          const root = gltf.scene;
          avatarMeshRef.current = root;

          // Sanitize bone names inside skeleton first (critical for SkinnedMesh lookup)
          let foundBoneRoot = null;
          root.traverse((obj) => {
            if (obj.isSkinnedMesh) {
              avatarSkinnedMeshRef.current = obj;
              obj.castShadow    = true;
              obj.receiveShadow = true;

              // Apply sandal skin color to Bodymat (face and hands)
              if (obj.material) {
                const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                materials.forEach(mat => {
                  if (mat.name === "Bodymat") {
                    mat.color.setHex(0xe5c298); // Premium Sandal Skin Tone
                    mat.roughness = 0.55;
                    mat.needsUpdate = true;
                  }
                  if (mat.name === "Hatmat") {
                    mat.color.setHex(0x000000); // Backup black color
                    mat.needsUpdate = true;
                  }
                });
              }

              if (obj.skeleton && obj.skeleton.bones) {
                obj.skeleton.bones.forEach(b => {
                  if (b.name) {
                    if (b.name.includes(":")) {
                      b.name = b.name.replace(":", "_");
                    } else if (b.name.startsWith("mixamorig") && !b.name.startsWith("mixamorig_")) {
                      b.name = b.name.replace("mixamorig", "mixamorig_");
                    }
                  }
                });
              }
            }
          });

          // Clean all object names in the scene graph to match remapped skeleton bone names
          root.traverse((obj) => {
            // Hide the hat completely
            if (obj.name && (obj.name.toLowerCase().includes("hat") || obj.name.toLowerCase().includes("headwear"))) {
              obj.visible = false;
            }

            if (obj.name) {
              if (obj.name.includes(":")) {
                obj.name = obj.name.replace(":", "_");
              } else if (obj.name.startsWith("mixamorig") && !obj.name.startsWith("mixamorig_")) {
                obj.name = obj.name.replace("mixamorig", "mixamorig_");
              }
            }
            if (obj.isBone && !foundBoneRoot) {
              foundBoneRoot = obj;
            }
          });

          // Store bone root — mixer must be attached here, not scene root
          boneRootRef.current = foundBoneRoot || root;
          console.log("[AvatarPanel] Bone root:", boneRootRef.current?.name);

          // Auto-fit: move feet to y=0, then frame camera on model
          root.updateMatrixWorld(true);
          const box    = new THREE.Box3().setFromObject(root);
          const size   = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          root.position.y = -box.min.y;   // feet on grid
          window.__boxInfo = {
            size: { x: size.x, y: size.y, z: size.z },
            center: { x: center.x, y: center.y, z: center.z },
            min: { x: box.min.x, y: box.min.y, z: box.min.z },
            max: { x: box.max.x, y: box.max.y, z: box.max.z }
          };
          console.log("[AvatarPanel] Model box info:", window.__boxInfo);
          scene.add(root);
          saveRestPose(root);

          // Recompute box after y offset, then set camera to show full body
          root.updateMatrixWorld(true);
          const box2   = new THREE.Box3().setFromObject(root);
          const size2  = box2.getSize(new THREE.Vector3());
          const center2 = box2.getCenter(new THREE.Vector3());
          const modelH = size2.y; // full height in world units
          // Pull back extra to show raised arms above head (1.4x gives ~30% headroom above body)
          const fitDist = (modelH / 2) / Math.tan((50 * Math.PI / 180) / 2) * 1.4;
          // Target slightly below waist so lower body stays in frame too
          camera.position.set(0, modelH * 0.38, fitDist);
          controls.target.set(0, modelH * 0.38, 0);
          controls.update();
          console.log(`[AvatarPanel] Camera fit: h=${modelH.toFixed(2)} dist=${fitDist.toFixed(2)}`);

          // Ensure matrix world is updated
          root.updateMatrixWorld(true);

          // ─────────────────────────────────────────────────────────────────
          // ─────────────────────────────────────────────────────────────────

          setStatus("Ready");
          setIsLoading(false);
        },
        undefined,
        (err) => {
          console.error("Failed to load avatar.glb:", err);
          setStatus("Error: Avatar model missing.");
          setIsLoading(false);
        }
      );

      // Render loop
      const animate = () => {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (mixerRef.current) {
          const delta = clockRef.current.getDelta();
          mixerRef.current.update(delta);
        }
        if (controlsRef.current) controlsRef.current.update();
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();

      // Resize handler
      const handleResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.offsetWidth;
        const h = mountRef.current.offsetHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      // Store cleanup
      cleanupFns.push(() => {
        window.removeEventListener("resize", handleResize);
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        if (rendererRef.current && mountRef.current) {
          rendererRef.current.dispose();
          if (mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
          }
        }
      });
    });

    // Outer cleanup: cancel RAF if component unmounts before it fires
    return () => {
      cancelAnimationFrame(rafId);
      cleanupFns.forEach(fn => fn());
    };
  }, []);


  // Helper to safely get or create the Three.js AnimationMixer.
  // Attach to scene root (avatarMeshRef). Three.js traverses the scene graph
  // by name to bind tracks to bones when clipAction() is called.
  const getOrCreateMixer = () => {
    if (!mixerRef.current && avatarMeshRef.current) {
      mixerRef.current = new THREE.AnimationMixer(avatarMeshRef.current);
      mixerRef.current.addEventListener("finished", (e) => {
        if (onAnimationFinishedRef.current) {
          onAnimationFinishedRef.current(e);
        }
      });
      console.log("[AvatarPanel] Mixer created on scene root:", avatarMeshRef.current.name);
    }
    return mixerRef.current;
  };

  // Play the next animation in the parsed queue
  const playNextInQueue = () => {
    if (queueIndexRef.current >= queueRef.current.length) {
      setIsPlaying(false);
      setStatus("Ready");
      return;
    }

    const currentItem = queueRef.current[queueIndexRef.current];
    queueIndexRef.current++;

    if (currentItem.isFingerspelling) {
      setStatus(`Spelling: ${currentItem.word.toUpperCase()}`);
      setSubtitles(`[Spelling]: ${currentItem.word.toUpperCase()}`);
      playSignAnimation("help.glb", `[Spelling]: ${currentItem.word.toUpperCase()}`, true);
    } else {
      setStatus(`Signing: ${currentItem.label.toUpperCase()}`);
      setSubtitles(currentItem.label);
      playSignAnimation(currentItem.filename, currentItem.label, true);
    }
  };

  // Update animation finished listener ref on every render to prevent stale closure bugs
  useEffect(() => {
    onAnimationFinishedRef.current = () => {
      playNextInQueue();
    };
  });

  // Trigger Playback & Greedy Queue Building when Text Prop updates
  useEffect(() => {
    if (!text || !avatarMeshRef.current) return;

    const cleanText = text.toLowerCase().trim().replace(/[.!?,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (!cleanText) return;

    // Greedy multi-word phrase matching algorithm
    const words = cleanText.split(/\s+/);
    const queue = [];
    let i = 0;
    while (i < words.length) {
      let matched = false;
      // Search for the longest matching key in ANIMATION_MAP starting at word i
      for (let len = Math.min(8, words.length - i); len >= 1; len--) {
        const phrase = words.slice(i, i + len).join(" ");
        if (ANIMATION_MAP[phrase]) {
          queue.push({
            filename: ANIMATION_MAP[phrase],
            label: phrase,
            isFingerspelling: false
          });
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) {
        queue.push({
          word: words[i],
          label: words[i],
          isFingerspelling: true
        });
        i++;
      }
    }

    if (queue.length > 0) {
      queueRef.current = queue;
      queueIndexRef.current = 0;
      playNextInQueue();
    }
  }, [text]);

  // Load and play animation GLB — tries direct play first, then retargeting
  const playSignAnimation = (filename, phraseLabel, isQueuePlayback = false) => {
    if (!avatarMeshRef.current) return;

    setIsLoading(true);
    setStatus(`Loading: ${phraseLabel}...`);
    setSubtitles(phraseLabel);

    const animPath = `/avatar/animations/${filename}`;
    const loader   = new GLTFLoader();

    const triggerAction = (action) => {
      if (currentActionRef.current && currentActionRef.current !== action) {
        currentActionRef.current.fadeOut(0.2);
      }
      action.reset().fadeIn(0.2).play();
      currentActionRef.current = action;
    };

    // Cache key per file
    const cacheKey = `direct_${filename}`;
    if (animActionsRef.current[cacheKey]) {
      const mixer = getOrCreateMixer();
      if (!mixer) return;
      // Stop previous action cleanly before replaying cached one
      if (currentActionRef.current && currentActionRef.current !== animActionsRef.current[cacheKey]) {
        currentActionRef.current.stop();
      }
      const cachedAction = animActionsRef.current[cacheKey];
      // Must stop() first to reset the "finished" clamp state, then play fresh
      cachedAction.stop();
      cachedAction.reset();
      cachedAction.setLoop(THREE.LoopOnce, 1);
      cachedAction.clampWhenFinished = true;
      cachedAction.fadeIn(0.15).play();
      currentActionRef.current = cachedAction;
      setIsLoading(false);
      setStatus("Playing");
      setIsPlaying(true);
      return;
    }

    loader.load(
      animPath,
      (animGLTF) => {
        try {
          // ── Strategy 1: Direct playback ─────────────────────────────────
          // Works when animation GLBs share the same Mixamo skeleton as avatar.glb
          const clips = animGLTF.animations;
          if (!clips || clips.length === 0) {
            throw new Error("No animation clips found in GLB");
          }

          // Detect if source is Mixamo-based. If not, we MUST use Retargeting (Strategy 2)
          // because SMPLX bone coordinate spaces differ, causing extreme distortion/inversion.
          let isMixamo = false;
          animGLTF.scene.traverse((node) => {
            if (node.name && node.name.toLowerCase().includes("mixamo")) {
              isMixamo = true;
            }
          });

          if (!isMixamo) {
            throw new Error("SMPLX/Non-Mixamo animation detected; forcing Retargeting Strategy.");
          }

          const clip = clips[0];
          getOrCreateMixer();

          // ── UE5 → Mixamo bone retargeting using exact name table ──────────
          // Strip .position tracks to prevent root-motion from flying the skeleton off screen.
          // ISL signing only needs bone rotations (.quaternion + .scale tracks).
          const remappedTracks = [];
          let matchedCount = 0;

          for (const track of clip.tracks) {
            const dotIdx = track.name.lastIndexOf(".");
            const boneName = dotIdx !== -1 ? track.name.slice(0, dotIdx) : track.name;
            const property = dotIdx !== -1 ? track.name.slice(dotIdx) : "";

            // Skip root-motion position tracks — they move the skeleton off-screen
            if (property === ".position") continue;

            const targetBone = BONE_MAPPING[boneName];
            if (targetBone && targetBone !== "mixamorig_Hips_01") { // Skip hips rotation to keep upright
              const newTrack = track.clone();
              newTrack.name = targetBone + property;
              remappedTracks.push(newTrack);
              matchedCount++;
            }
          }

          console.log(`[AvatarPanel] Remapped ${matchedCount}/${clip.tracks.length} tracks for ${filename}`);

          if (remappedTracks.length === 0) {
            throw new Error(`0 tracks matched for ${filename} — check BONE_MAPPING map`);
          }

          const remappedClip = new THREE.AnimationClip(
            clip.name || filename,
            clip.duration,
            remappedTracks
          );

          const action = mixerRef.current.clipAction(remappedClip);
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;

          animActionsRef.current[cacheKey] = action;
          triggerAction(action);
          setStatus("Playing");
          setIsPlaying(true);

        } catch (err) {
          console.warn("Direct play failed, trying retarget:", err.message);

          // ── Strategy 2: Retargeting fallback ────────────────────────────
          try {
            const retargetedClip = retargetAnimation(animGLTF, avatarMeshRef.current, debugLevel);

            if (retargetedClip.tracks.length === 0) {
              throw new Error("Retargeting produced 0 tracks — bone names don't match");
            }

            getOrCreateMixer();

            const action = mixerRef.current.clipAction(retargetedClip);
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;

            animActionsRef.current[cacheKey] = action;
            triggerAction(action);
            setStatus("Playing");
            setIsPlaying(true);
          } catch (retargetErr) {
            console.error("Both play strategies failed:", retargetErr.message);
            setStatus("Animation error — check console");
          }
        } finally {
          setIsLoading(false);
        }
      },
      undefined,
      (loadErr) => {
        console.error(`Failed to load ${animPath}:`, loadErr);
        setStatus(`Error loading animation`);
        setIsLoading(false);
      }
    );
  };

  // Action Buttons
  const handlePlayPause = () => {
    if (!currentActionRef.current) return;
    if (isPlaying) {
      currentActionRef.current.paused = true;
      setIsPlaying(false);
      setStatus("Paused");
    } else {
      currentActionRef.current.paused = false;
      setIsPlaying(true);
      setStatus("Playing");
    }
  };

  const handleReplay = () => {
    if (!currentActionRef.current) return;
    currentActionRef.current.reset();
    currentActionRef.current.paused = false;
    setIsPlaying(true);
    setStatus("Playing");
  };

  return (
    <div className="glass-card avatar-card">
      <div className="avatar-header">
        <h3>🤟 3D Sign Language Avatar</h3>
        <span className={`status-pill ${status === "Playing" ? "status-playing" : ""}`}>
          {status}
        </span>
      </div>

      {/* Main rendering viewport */}
      <div className="avatar-viewport-container">
        <div ref={mountRef} className="avatar-canvas-mount" />

        {isLoading && (
          <div className="avatar-loader">
            <div className="spinner"></div>
            <span>Processing bones...</span>
          </div>
        )}

        {/* Dynamic subtitle overlay */}
        {subtitles && (
          <div className="avatar-subtitle-overlay">
            <span className="subtitle-word">{subtitles}</span>
          </div>
        )}

        {/* Hand Active Indicator — glows while signing */}
        {isPlaying && (
          <div className="hand-active-overlay">
            <span className="hand-pulse">🤟</span>
            <span className="hand-label">Hands signing...</span>
          </div>
        )}

        {/* Orbit Control Tip */}
        <div className="orbit-info">
          <Info size={12} />
          <span>Click &amp; Drag to rotate avatar · Scroll to Zoom</span>
        </div>
      </div>

      {/* Control Actions Row */}
      <div className="avatar-controls">
        <div className="playback-buttons">
          <button className="ctrl-btn" onClick={handlePlayPause} disabled={!currentActionRef.current}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button className="ctrl-btn" onClick={handleReplay} disabled={!currentActionRef.current}>
            <RotateCcw size={18} />
            <span>Replay</span>
          </button>
        </div>

        {/* Mathematical Bone Levels */}
        <div className="bone-settings">
          <label>
            <Settings size={14} style={{ marginRight: 4 }} />
            Bone Mapping Level:
          </label>
          <select
            value={debugLevel}
            onChange={(e) => {
              setDebugLevel(Number(e.target.value));
              if (text) {
                // Trigger reload to clear cache
                animActionsRef.current = {};
              }
            }}
          >
            <option value={0}>0: Rest Pose (No Motion)</option>
            <option value={1}>1: Torso Only</option>
            <option value={2}>2: Torso + Upper Arms</option>
            <option value={3}>3: Torso + Arms + Wrists</option>
            <option value={4}>4: Full Body & Finger Mesh (Best)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
