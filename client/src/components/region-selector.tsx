import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function RegionSelector({ image, onChange }: { image: string; onChange: (mask: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const previous = useRef<{x:number;y:number} | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [tool, setTool] = useState<"brush" | "erase">("brush");
  const [size, setSize] = useState(35);
  const [ready, setReady] = useState(false);
  const [rectangle, setRectangle] = useState({left:25,top:25,width:50,height:50});
  useEffect(() => { onChange(enabled ? "selection-required" : null); setReady(false); }, [image, enabled]);
  function emit() {
    if (!canvas.current) return;
    const output = document.createElement("canvas");
    output.width = canvas.current.width; output.height = canvas.current.height;
    const ctx = output.getContext("2d")!;
    ctx.fillStyle = "black"; ctx.fillRect(0,0,output.width,output.height);
    ctx.drawImage(canvas.current,0,0);
    const pixels = ctx.getImageData(0,0,output.width,output.height).data;
    const hasMask = pixels.some((v,i) => i % 4 === 0 && v > 127);
    onChange(hasMask ? output.toDataURL("image/png") : "selection-required");
  }
  function stroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !ready) return;
    const c = e.currentTarget, rect = c.getBoundingClientRect();
    const point = { x:(e.clientX-rect.left)*c.width/rect.width, y:(e.clientY-rect.top)*c.height/rect.height };
    const ctx = c.getContext("2d")!;
    ctx.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over";
    ctx.strokeStyle = "white"; ctx.fillStyle = "white"; ctx.lineWidth = size*c.width/rect.width; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(previous.current?.x ?? point.x,previous.current?.y ?? point.y); ctx.lineTo(point.x,point.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(point.x,point.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();
    previous.current=point;
  }
  return <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
    <label className="flex items-center gap-3 font-medium text-slate-900"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}/>Edit a specific area</label>
    {enabled && <><p className="text-sm text-slate-600">Paint over only the siding or roof section you want to change. Everything outside your selection stays in place. Product appearance is an AI preview.</p>
      <div className="flex gap-2 items-center flex-wrap"><Button type="button" size="sm" variant={tool === "brush" ? "default" : "outline"} onClick={() => setTool("brush")}>Brush</Button><Button type="button" size="sm" variant={tool === "erase" ? "default" : "outline"} onClick={() => setTool("erase")}>Erase</Button><label className="text-sm">Brush size <input type="range" min="5" max="100" value={size} onChange={e => setSize(Number(e.target.value))}/></label><Button type="button" size="sm" variant="outline" onClick={() => { const c=canvas.current; if(c)c.getContext("2d")!.clearRect(0,0,c.width,c.height);onChange("selection-required"); }}>Clear selection</Button></div>
      <details className="text-sm"><summary className="cursor-pointer">Select a rectangle with keyboard controls</summary><div className="grid grid-cols-2 gap-3 my-3">{Object.entries(rectangle).map(([key,value]) => <label key={key} className="capitalize">{key} (%)<input className="block w-full" type="range" min={key === "width" || key === "height" ? 1 : 0} max="100" value={value} onChange={e => setRectangle(current => ({...current,[key]:Number(e.target.value)}))}/></label>)}</div><Button type="button" size="sm" disabled={!ready} onClick={() => {const c=canvas.current;if(!c)return;const ctx=c.getContext("2d")!;ctx.globalCompositeOperation="source-over";ctx.fillStyle="white";ctx.fillRect(c.width*rectangle.left/100,c.height*rectangle.top/100,c.width*rectangle.width/100,c.height*rectangle.height/100);emit();}}>Add rectangle to selection</Button></details>
      <div className="relative w-full"><img src={image} alt="Select the area to edit" className="w-full rounded-lg" onLoad={e => { const img=e.currentTarget,c=canvas.current;if(c){const scale=Math.min(1,1600/img.naturalWidth);c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);setReady(true);} }}/><canvas ref={canvas} aria-label="Paint the area to edit with a mouse or touch" className="absolute inset-0 w-full h-full opacity-60 rounded-lg" style={{touchAction:"none",cursor:"crosshair"}} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;previous.current=null;stroke(e); }} onPointerMove={stroke} onPointerUp={() => {drawing.current=false;previous.current=null;emit();}} onPointerCancel={() => {drawing.current=false;previous.current=null;emit();}}/></div>
    </>}
  </div>;
}
