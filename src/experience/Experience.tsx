"use client";
import {chapters} from "./chapters";
export function Experience(){return <main className="experience"><div className="hud" aria-hidden="true"/>{chapters.map(([n,title,note])=><section className="chapter" data-chapter={n} key={n}><div><div className="chapter__label">{n} / {title}</div><h1 className="chapter__title">{title}</h1><p className="chapter__note">{note}</p></div></section>)}</main>}
