import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
 function BabylonScene() {
    const canvasRef = useRef(null);
    
    const [currentpage, setcurrentpage] = useState(0);

    useEffect(() => {
        if (canvasRef.current) {
            const engine = new BABYLON.Engine(canvasRef.current, true);
            const scene = new BABYLON.Scene(engine);
            
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skyboxMaterial.disableLighting = true;

            const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
            skybox.material = skyboxMaterial;
            
            // Setup camera
            const camera = new BABYLON.ArcRotateCamera("camera", 0, .001, 15, new BABYLON.Vector3(0, 0, 0), scene);
            camera.attachControl(canvasRef.current, true);
    
            // Setup light (no need to assign to a variable if not used later)
            const light=  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(10, 20, 50), scene);
            light.intensity=.5;
            const light2=  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(10, -90, -50), scene);
            light2.intensity=1;
            BABYLON.SceneLoader.ImportMesh("", "/models/3dAssets/", "candle.glb", scene, (meshes) => {
                const candleMesh = meshes[0]; // Assuming the candle is the first mesh in the array
                candleMesh.scaling = new BABYLON.Vector3(15, 15, 15);
                candleMesh.position = new BABYLON.Vector3(-6, .25, 3);

                const animation = new BABYLON.Animation(
                    "candleAnimation", // Name of the animation
                    "position.y", // Property to animate (Y position)
                    30, // Animation speed
                    BABYLON.Animation.ANIMATIONTYPE_FLOAT, // Animation type
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE // Animation loop mode
                );

                // Define keyframes for the animation
                const keys = [];
                keys.push({
                    frame: 0,
                    value: 0.25, // Initial Y position
                });
                keys.push({
                    frame: 50,
                    value: 1, // Final Y position (peak of the float)
                });
                keys.push({
                    frame: 100,
                    value: 0.25, // Final Y position
                });

                // Assign the keyframes to the animation
                animation.setKeys(keys);

                // Apply the animation to the candle mesh
                candleMesh.animations = [animation];
                scene.beginAnimation(candleMesh, 0, 100, true);
            });

            // Load your .glb model
            BABYLON.SceneLoader.ImportMesh("", "/models/3dAssets/", "book.glb", scene, (newMeshes, particles, skeletons, animationGroup) => {
                const armatureAction = animationGroup.find(group => group.name === "Armature.001Action");
                armatureAction.stop();
                armatureAction.start();

                const plane = BABYLON.MeshBuilder.CreatePlane("plane", { height:6, width:6 }, scene);
                const videoTexture = new BABYLON.VideoTexture("videoTexture", ["/models/3dAssets/demo2.mp4"], scene, true);
                const videoMaterial = new BABYLON.StandardMaterial("materialForVideo", scene);
                videoMaterial.diffuseTexture = videoTexture;
                plane.material = videoMaterial;
                
                // Position the plane where you want the video to appear
                plane.position = new BABYLON.Vector3(-1000, 2, 0);
                plane.rotation.y = Math.PI/-2;

                const dynamicTexture = new BABYLON.DynamicTexture("dynamicTexture", {width: 1024, height: 1024}, scene, false);
                const material = new BABYLON.StandardMaterial("materialForBook", scene);
                material.diffuseTexture = dynamicTexture;
                const context = dynamicTexture.getContext();
                const coverImage = new Image();
                let x  = 0;
                const drawText = (inputText, startX, startY, spacing, fontSize, font, newLine) => {
                    let fontStyle = "";
                    if (font.includes("Bold")) {
                        fontStyle = "bold";
                    }
                    
                    context.font = `${fontStyle} ${fontSize}px '${font}'`; 
                    context.fillStyle = "black";
                    
                    for (const character of inputText) {
                        if(character !== "\n"){
                            context.fillText(character, startX, startY);
                            startX  += spacing;
                            x += 1;
                        } 
                        else {
                            startX -= (spacing * x);
                            startY += newLine; 
                            x = 0;
                        }
                    }
                    dynamicTexture.update();
                }; 
                
                const bookMesh = newMeshes.find(mesh => mesh.name === "Cube.003"); 
                const planeMesh = newMeshes.find(mesh => mesh.name === "Plane");
                  
                if(planeMesh){
                    const dynamicTexture = new BABYLON.DynamicTexture("dynamicTexture", {width: 1024, height: 1024}, scene, false);
                    const materialplane = new BABYLON.StandardMaterial("materialForPlane", scene);
                    materialplane.diffuseTexture = dynamicTexture;
                    planeMesh.material = materialplane;

                    const tableImage = new Image();
                    tableImage.onload = () => {
                        dynamicTexture.getContext().drawImage(tableImage, 0, 0);
                        dynamicTexture.update();
                    };
                    tableImage.src = "/models/3dAssets/table.jpg";
                }         
                
                 if (bookMesh) {
                    coverImage.onload = () => {
                            // Draw the cover image on the left half of the dynamic texture
                        context.drawImage(coverImage, 0, 0, dynamicTexture.getSize().width / 2, dynamicTexture.getSize().height);
                        dynamicTexture.update();  // Update the texture after the image is drawn
                    };

                    coverImage.src = "/models/3dAssets/cover.jpg";  // Make sure this path is correct
                    const pageImage = new Image();
                
                    pageImage.onload = () => {
                            // Draw the page image on the right half of the dynamic texture
                        context.drawImage(pageImage, dynamicTexture.getSize().width / 3, 0, dynamicTexture.getSize().width / 2, dynamicTexture.getSize().height);
                        context.translate(525, 400);
                        context.scale(-1, 1);
                        dynamicTexture.drawText("Table Of Contents", -60, -5, "20px Georgia", "dark grey");
                        dynamicTexture.drawText("Ethan Albright", -33, 18, "bold 14px Georgia", "black");
                        dynamicTexture.drawText("Software Engineer", -37, 35, "15px Georgia");
                        dynamicTexture.drawText("1. Networked Multiplayer API", -75, 80, "bold 12px Georgia");
                        dynamicTexture.drawText("2. Mini Search Enginer", -75, 120, "bold 12px Georgia");
                        dynamicTexture.drawText("3. Python TBD", -75, 160, "bold 12px Georgia");
                        dynamicTexture.drawText("4. Web Based Music Player", -75, 200, "bold 12px Georgia");
                        dynamicTexture.drawText("5. Another Python TBD", -75, 240, "bold 12px Georgia");                        
                        
                        dynamicTexture.update();
                    };
                    pageImage.src = "/models/3dAssets/old.jpg";  
                    bookMesh.material = material;
        
                } 
                                
                function turn(){
                    armatureAction.stop();
                    armatureAction.start();

                    setcurrentpage(prev => {
                        const next = (prev + 1) % 3;
                        const context = dynamicTexture.getContext();
                        switch (next) {
                            case 0:
                                var yourImage = new Image();
                                yourImage.src = "/models/3dAssets/old.jpg";                    
                                
                                context.drawImage(yourImage, -250, -20, 500, 800);
                                dynamicTexture.drawText("Chapter Three", -180, 340, "bold 12px Georgia");                                dynamicTexture.update();
                                dynamicTexture.drawText("Web Based Music Player", -220, 360, "bold 12px Georgia");                                dynamicTexture.update();
                                break;
                            case 1:
                                yourImage = new Image();
                                yourImage.src = "/models/3dAssets/old.jpg";                    
                            
                                context.drawImage(yourImage, -250, -20, 500, 800);
                                
                                dynamicTexture.drawText("Chapter One", -190, 340, "bold 12px Georgia");                                dynamicTexture.update();
                                dynamicTexture.drawText("Networked Multiplayer API", -225, 360, "bold 12px Georgia");
                                dynamicTexture.drawText("Simple 2D Shooter Demo", -65, -5, "bold 12px Georgia");
                                plane.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
                                setTimeout(() => {
                                    plane.position = new BABYLON.Vector3(0, .75, 1.5);
                                }, 2100);
                                plane.rotation.x = 1.6;
                                dynamicTexture.update();
                            //: P  p
                                break;
                        
                            case 2:
                                plane.position = new BABYLON.Vector3(100, .75, 1.5);
                                yourImage = new Image();
                                yourImage.src = "/models/3dAssets/old.jpg";                    
                            
                                context.drawImage(yourImage, -250, -20, 500, 800);
                                dynamicTexture.drawText("Chapter Two", -180, 340, "bold 12px Georgia"); 
                                dynamicTexture.drawText("Mini Search Engine", -200, 360, "bold 12px Georgia"); 
                                dynamicTexture.update();
                                break;
            
                        }
                        return next;
                        
                    });
                }
            
                
                bookMesh.actionManager = new BABYLON.ActionManager(scene);
                bookMesh.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, 
                    ()  => {
                        turn();
                    }
                )
            );
                
            });
    
            engine.runRenderLoop(() => {
                scene.render();
            });
    
            return () => {
                engine.dispose();
            };
        }
    }, []);
    
   return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh' }}></canvas>;
}

export default BabylonScene;
