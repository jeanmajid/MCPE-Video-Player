import { system, world } from "@minecraft/server";
import { frameCount, fps } from "./data";

let isPlaying = false;

world.afterEvents.itemUse.subscribe((data) => {
    if (data.itemStack.typeId !== "minecraft:compass") return;
    if (isPlaying) return data.source.sendMessage("§cVideo is still playing");
    let currentFrame = 1;
    isPlaying = true;

    const video = world.getDimension("overworld").getEntities({ type: "jeanmajid:video" })[0];

    video.dimension.runCommandAsync("playsound video.sound @a ~~~ 1 1 1");
    const interval = system.runInterval(() => {
        if (currentFrame > frameCount) {
            isPlaying = false;
            return system.clearRun(interval);
        }
        video.getComponent("skin_id").value = currentFrame;
        currentFrame++;
    }, 1);

    // const videos = world.getDimension("overworld").getEntities({ type: "jeanmajid:video" });

    // videos[0].dimension.runCommandAsync("playsound video.sound @a ~~~ 1 1 1");
    // const interval = system.runInterval(() => {
    //     if (currentFrame > frameCount) return system.clearRun(interval);
    //     for (const video of videos) {
    //          video.getComponent("skin_id").value = currentFrame;
    //     }
    //     currentFrame++;
    // }, 1);
});
