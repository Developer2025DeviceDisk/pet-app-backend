const express = require("express");
const router = express.Router();
const petController = require("../controllers/pet.controller");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.post("/", auth, upload.array("images", 5), petController.createPetProfile);
router.get("/", auth, petController.getAllPets);
router.get("/my-pets", auth, petController.getMyPets);
router.post("/like", auth, petController.likePet);


module.exports = router;
