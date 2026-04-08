import fs from 'fs';
import path from 'path';

// ฟังก์ชันง่ายๆ ในการโหลด .env 
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^#\s][^\s=]*)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2].replace(/['"]/g, '').trim();
      }
    });
  } catch (err) {
    console.warn("Warning: Could not read .env file. Ensure VITE_VAST_API_URL is set.");
  }
}

// 1. รับค่า Gender
const targetGender = (process.argv[2] || 'female').toLowerCase();

const prompts = {
  male: [
    "masterpiece, best quality, very aesthetic, absurdres, 1boy, solo, portrait, short messy black hair, handsome, detailed eyes, looking at viewer, casual hoodie, 2d anime style, flat color, solid background",
    "masterpiece, best quality, very aesthetic, absurdres, 1boy, solo, portrait, smart looking, glasses, office shirt, gentle smile, 2d anime style, flat color",
    "masterpiece, best quality, very aesthetic, absurdres, 1boy, solo, portrait, street wear, cool expression, spiky hair, neon background, 2d anime style"
  ],
  female: [
    "masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, portrait, cute smile, long straight hair, pink dress, drooling, half-closed eyes, 2d anime style, flat color, solid background",
    "masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, portrait, short bob hair, looking shy, school uniform, detailed beautiful eyes, 2d anime style, flat color",
    "masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, portrait, elegant, wavy brown hair, elegant gown, soft lighting, 2d anime style"
  ]
};

async function main() {
  loadEnv();
  const VAST_URL = process.env.VITE_VAST_API_URL;
  if (!VAST_URL) {
    console.error("❌ Error: VITE_VAST_API_URL is missing.");
    return;
  }

  console.log(`🔌 [1/4] Connecting to Vast.ai API at: ${VAST_URL}`);
  
  try {
    // 2. ดึง Models ทั้งหมด
    const resModels = await fetch(`${VAST_URL}/sdapi/v1/sd-models`);
    if (!resModels.ok) throw new Error("Failed to fetch models");
    
    const models = await resModels.json();
    if (models.length === 0) throw new Error("No models found on Vast.ai");

    // ล็อคเป้าใช้ Model Animagine
    const animagineModel = models.find(m => m.title.toLowerCase().includes('animaginexl'));
    const targetModel = animagineModel ? animagineModel.title : models[Math.floor(Math.random() * models.length)].title;
    console.log(`🔄 [2/4] Switching to Model: ${targetModel}...`);

    // 3. เปลี่ยน Model (Set options)
    const resOpts = await fetch(`${VAST_URL}/sdapi/v1/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sd_model_checkpoint: targetModel })
    });
    
    if (!resOpts.ok) throw new Error("Failed to switch model");
    console.log(`✅ Model switched successfully.`);

    // 4. สุ่ม Prompt สำหรับ Generate
    const genderPrompts = prompts[targetGender] || prompts.female;
    const randomPrompt = genderPrompts[Math.floor(Math.random() * genderPrompts.length)];
    const negativePrompt = "lowres, (bad), text, error, missing, extra, fewer, cropped, jpeg artifacts, worst quality, bad quality, watermark, displeasing, unfinished, chromatic aberration, scan, scan artifacts, ugly";
    
    console.log(`🎨 [3/4] Generating image for [${targetGender}]...`);
    console.log(`   📝 Prompt: "${randomPrompt}"`);

    // ส่งคำสั่ง Generate 
    const resGen = await fetch(`${VAST_URL}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: randomPrompt,
        negative_prompt: negativePrompt,
        steps: 28,
        width: 832,
        height: 1152,
        sampler_name: "Euler a",
        cfg_scale: 7
      })
    });

    if (!resGen.ok) throw new Error(`Generation failed with payload code ${resGen.status}`);
    const genData = await resGen.json();

    if (genData && genData.images && genData.images[0]) {
      const base64Data = genData.images[0];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `output_${targetGender}_${Date.now()}.png`;
      const outputPath = path.resolve(process.cwd(), filename);
      
      fs.writeFileSync(outputPath, buffer);
      console.log(`🎉 [4/4] Success! Image saved to: ${outputPath}`);
    }

  } catch (error) {
    console.error("❌ An error occurred:", error.message);
  }
}

main();
