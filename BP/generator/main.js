const { exec } = require("child_process");
const fs = require("fs");

const BPPATH = "../";
const RPPATH = "../../RP";

const videoPath = "C:/Users/jeanh/Downloads/badappl.mp4";
const outputFolder = RPPATH + "textures/video";
const resolution = "1280x720";
const fps = 20;

fs.readdir(outputFolder, (err, files) => {
    if (err) {
        console.error(`Error reading folder contents: ${err}`);
        return;
    }
    files.forEach((file) => {
        const filePath = outputFolder + "/" + file;
        fs.rm(filePath, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err}`);
            }
        });
    });
});

const command = `ffmpeg -i ${videoPath} -vf "fps=${fps}" -s ${resolution} ${outputFolder}/%d.png`;

exec(command, (error, stdout, stderr) => {
    fs.readdir(outputFolder, (err, files) => {
        if (err) {
            console.error(`Error reading the directory: ${err}`);
            return;
        }

        const frameFiles = files.filter((file) => file.endsWith(".png"));
        const frameNumbers = frameFiles.map((file) => parseInt(file.split(".")[0], 10));
        const maxFrameNumber = Math.max(...frameNumbers);
        console.log(`Total frames: ${maxFrameNumber}`);

        for (let i = 1; i <= maxFrameNumber; i++) {
            addToBpTemplate(i);
            addToTPTemplate(i);
            addToTPRenderTemplate(i);
        }

        fs.writeFileSync(BPPATH + "entities/video.json", JSON.stringify(entityBPTemplate, null, 4));
        fs.writeFileSync(RPPATH + "entity/video.json", JSON.stringify(entityTPTemplate, null, 4));
        fs.writeFileSync(RPPATH + "render_controllers/video.json", JSON.stringify(entityTPRenderTemplate, null, 4));

        fs.writeFileSync(
            BPPATH + "scripts/data.js",
            `export const frameCount = ${maxFrameNumber};
            export const fps = ${fps};`
        );

        convertMp4ToOgg(videoPath, RPPATH + "sounds/video/sound.ogg");
    });
});

const entityBPTemplate = {
    format_version: "1.20.80",
    "minecraft:entity": {
        description: {
            identifier: "jeanmajid:video",
            is_spawnable: true,
            is_summonable: true,
            is_experimental: false,
        },

        components: {
            "minecraft:type_family": {
                family: ["video"],
            },
            "minecraft:damage_sensor": {
                triggers: {
                    cause: "all",
                    deals_damage: false,
                },
            },
            "minecraft:fire_immune": true,
            "minecraft:knockback_resistance": {
                value: 9999,
            },
            "minecraft:physics": {
                has_gravity: false,
            },
            "minecraft:pushable": {
                is_pushable: false,
            },
            "minecraft:skin_id": {
                value: 1,
            },
        },
        component_groups: {},
        events: {},
    },
};

function addToBpTemplate(i) {
    entityBPTemplate["minecraft:entity"].component_groups[`v${i}`] = {
        "minecraft:skin_id": {
            value: i,
        },
    };
    entityBPTemplate["minecraft:entity"].events[`v${i}`] = {
        add: {
            component_groups: [`v${i}`],
        },
    };
}

const entityTPTemplate = {
    format_version: "1.20.41",
    "minecraft:client_entity": {
        description: {
            identifier: "jeanmajid:video",
            materials: {
                default: "entity_custom",
            },
            textures: {
                v1: "textures/video/1",
                v2: "textures/video/2",
            },
            geometry: {
                default: "geometry.video",
            },
            render_controllers: ["controller.render.video"],
        },
    },
};

function addToTPTemplate(i) {
    entityTPTemplate["minecraft:client_entity"].description.textures[`v${i}`] = `textures/video/${i}`;
}

const entityTPRenderTemplate = {
    format_version: "1.20.41",
    render_controllers: {
        "controller.render.video": {
            arrays: {
                textures: {
                    "Array.skins": [],
                },
            },
            geometry: "Geometry.default",
            materials: [{ "*": "Material.default" }],
            textures: ["Array.skins[query.skin_id]"],
        },
    },
};

function addToTPRenderTemplate(i) {
    entityTPRenderTemplate.render_controllers["controller.render.video"].arrays.textures["Array.skins"].push(`texture.v${i}`);
}

function convertMp4ToOgg(mp4FilePath, outputOggFilePath) {
    fs.rmSync(RPPATH + "sounds/video/sound.ogg", { force: true });
    const tempAudioPath = "temp_audio.aac";
    const extractAudioCommand = `ffmpeg -i "${mp4FilePath}" -vn -acodec copy "${tempAudioPath}"`;

    exec(extractAudioCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error extracting audio: ${error}`);
            return;
        }

        const convertToOggCommand = `ffmpeg -i "${tempAudioPath}" -acodec libvorbis -q:a 5 "${outputOggFilePath}"`;

        exec(convertToOggCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error converting to OGG: ${error}`);
                return;
            }

            console.log("Conversion to OGG complete.");
            fs.unlink(tempAudioPath, (err) => {
                if (err) console.error(`Error deleting temporary file: ${err}`);
            });

            fs.rmSync(BPPATH + `generator/${tempAudioPath}`, { force: true });
        });
    });
}
