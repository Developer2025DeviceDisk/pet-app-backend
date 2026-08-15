const express = require("express");
const router = express.Router();
const petController = require("../controllers/pet.controller");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.post("/", auth, upload.array("images", 5), petController.createPetProfile);
router.put("/:id", auth, upload.array("images", 5), petController.updatePetProfile);
router.get("/", auth, petController.getAllPets);
router.get("/my-pets", auth, petController.getMyPets);
router.post("/like", auth, petController.likePet);
router.post("/dislike", auth, petController.dislikePet);
router.post("/verify-image", auth, upload.single("image"), petController.verifyImage);

module.exports = router;
