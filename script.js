/* ==========================================================
   ARDEN STUDIO
   Luxury Cinematic Photography Portfolio
   Main JavaScript
   ========================================================== */


"use strict";



/* ==========================================================
   GSAP INITIALIZATION
   ========================================================== */


gsap.registerPlugin(ScrollTrigger);



/* ==========================================================
   LENIS SMOOTH SCROLL
   ========================================================== */


const lenis = new Lenis({

    duration:1.2,

    smoothWheel:true,

    wheelMultiplier:1,

    touchMultiplier:1.5,

    infinite:false

});



function raf(time){

    lenis.raf(time);

    requestAnimationFrame(raf);

}


requestAnimationFrame(raf);





/* Sync GSAP ScrollTrigger with Lenis */


lenis.on(
    "scroll",
    ScrollTrigger.update
);


gsap.ticker.add(
    (time)=>{

        lenis.raf(time * 1000);

    }
);


gsap.ticker.lagSmoothing(0);







/* ==========================================================
   PAGE LOADER
   ========================================================== */


window.addEventListener(
"load",
()=>{


const loader =
document.querySelector(".page-loader");


const logo =
document.querySelector(".loader-logo");


const line =
document.querySelector(".loader-line::after");



const tl =
gsap.timeline();



tl.to(
".loader-line",
{
    opacity:1,
    duration:.3
}
);



tl.to(
".loader-line",
{
    width:"300px",
    duration:1,
    ease:"power3.inOut"
}
);



tl.to(
loader,
{
    yPercent:-100,
    duration:1.4,
    ease:"expo.inOut"
}
);



tl.from(
".hero-content > *",
{
    y:80,
    opacity:0,
    duration:1,
    stagger:.15,
    ease:"power4.out"
},
"-=.6"
);



}
);







/* ==========================================================
   HEADER SCROLL EFFECT
   ========================================================== */


const header =
document.querySelector(".site-header");



lenis.on(
"scroll",
({scroll})=>{


if(scroll > 80){

    header.classList.add(
        "scrolled"
    );

}

else{

    header.classList.remove(
        "scrolled"
    );

}


}
);








/* ==========================================================
   CUSTOM CURSOR
   ========================================================== */


const cursor =
document.querySelector(".cursor");



let mouseX = 0;

let mouseY = 0;



let cursorX = 0;

let cursorY = 0;



window.addEventListener(
"mousemove",
(e)=>{


mouseX = e.clientX;

mouseY = e.clientY;


}
);



function animateCursor(){


cursorX +=
(mouseX - cursorX) * .15;


cursorY +=
(mouseY - cursorY) * .15;



cursor.style.transform =
`
translate3d(
${cursorX}px,
${cursorY}px,
0
)
translate(-50%,-50%)
`;



requestAnimationFrame(
animateCursor
);


}


animateCursor();





const interactiveElements =
document.querySelectorAll(
"a,button,.tilt-card,.gallery-slide"
);



interactiveElements.forEach(
element=>{


element.addEventListener(
"mouseenter",
()=>{


cursor.style.width="60px";

cursor.style.height="60px";


}
);



element.addEventListener(
"mouseleave",
()=>{


cursor.style.width="32px";

cursor.style.height="32px";


}
);



}
);









/* ==========================================================
   HERO IMAGE PARALLAX
   ========================================================== */


const heroImage =
document.querySelector(
".hero-background img"
);



if(heroImage){


gsap.to(
heroImage,
{

    yPercent:15,

    scale:1.25,

    ease:"none",

    scrollTrigger:{

        trigger:".hero",

        start:"top top",

        end:"bottom top",

        scrub:true

    }

}

);


}







/* ==========================================================
   TEXT SPLIT REVEALS
   ========================================================== */


const splitTitles =
document.querySelectorAll(
".split"
);



splitTitles.forEach(
title=>{


const split =
new SplitType(
title,
{
    types:
    "words,chars"
}
);



gsap.from(
split.chars,
{

    y:100,

    opacity:0,

    rotateX:-90,

    stagger:.02,

    duration:1,

    ease:"power4.out",

    scrollTrigger:{

        trigger:title,

        start:"top 80%"

    }

}

);



}
);








/* ==========================================================
   GENERIC REVEAL ANIMATIONS
   ========================================================== */


const reveals =
document.querySelectorAll(
".reveal"
);



reveals.forEach(
element=>{


gsap.from(
element,
{

    opacity:0,

    y:60,

    filter:"blur(10px)",

    duration:1.2,

    ease:"power3.out",

    scrollTrigger:{

        trigger:element,

        start:"top 85%"

    }

}

);


}
);

/* ==========================================================
   FLOATING CARD 3D TILT
   ========================================================== */


const tiltCards =
document.querySelectorAll(
".tilt-card"
);



tiltCards.forEach(
card=>{


card.addEventListener(
"mousemove",
(e)=>{


const rect =
card.getBoundingClientRect();



const x =
e.clientX - rect.left;



const y =
e.clientY - rect.top;



const centerX =
rect.width / 2;



const centerY =
rect.height / 2;



const rotateX =
-(y-centerY) / 18;



const rotateY =
(x-centerX) / 18;



gsap.to(
card,
{

    rotateX,

    rotateY,

    transformPerspective:1000,

    duration:.4,

    ease:"power2.out"

}

);



}
);



card.addEventListener(
"mouseleave",
()=>{


gsap.to(
card,
{

    rotateX:0,

    rotateY:0,

    duration:.8,

    ease:"elastic.out(1,.5)"

}

);



}
);



}
);









/* ==========================================================
   HERO MOUSE PARALLAX
   ========================================================== */


const hero =
document.querySelector(
".hero"
);



if(hero){


hero.addEventListener(
"mousemove",
(e)=>{


const x =
(e.clientX / window.innerWidth - .5);



const y =
(e.clientY / window.innerHeight - .5);



gsap.to(
".hero-content",
{

    x:x * 20,

    y:y * 20,

    duration:1,

    ease:"power3.out"

}

);



gsap.to(
".floating-orb",
{

    x:x * -50,

    y:y * -50,

    duration:2,

    ease:"power3.out"

}

);



}
);


}







/* ==========================================================
   COUNTER ANIMATIONS
   ========================================================== */


const counters =
document.querySelectorAll(
"[data-counter]"
);



counters.forEach(
counter=>{


const target =
Number(
counter.dataset.counter
);



ScrollTrigger.create({

trigger:counter,


start:"top 85%",



once:true,



onEnter:()=>{


let value =
{
    current:0
};



gsap.to(
value,
{

    current:target,

    duration:2,

    ease:"power2.out",


    onUpdate:()=>{


        counter.textContent =
        Math.round(
            value.current
        );

    }

}

);



}



});



}
);









/* ==========================================================
   TIMELINE ANIMATION
   ========================================================== */


gsap.utils.toArray(
".timeline-item"
)
.forEach(
item=>{


gsap.from(
item,
{

    opacity:0,

    y:100,

    rotateX:-20,

    duration:1,

    ease:"power3.out",


    scrollTrigger:{

        trigger:item,

        start:"top 80%"

    }

}

);



}
);








/* ==========================================================
   BRAND CARDS
   ========================================================== */


gsap.from(
".brand-card",
{

    y:80,

    opacity:0,

    stagger:.15,

    duration:1,

    ease:"power4.out",


    scrollTrigger:{

        trigger:".brand-grid",

        start:"top 80%"

    }

}

);








/* ==========================================================
   STATISTICS PARALLAX
   ========================================================== */


gsap.to(
".statistics",
{

    backgroundPosition:
    "50% 100%",

    ease:"none",

    scrollTrigger:{

        trigger:".statistics",

        scrub:true

    }

}

);









/* ==========================================================
   HORIZONTAL GALLERY SCROLL
   ========================================================== */


const galleryTrack =
document.querySelector(
".gallery-track"
);



if(galleryTrack){



const slides =
gsap.utils.toArray(
".gallery-slide"
);



gsap.to(
galleryTrack,
{

x:()=>{

return -(galleryTrack.scrollWidth - window.innerWidth);

},


ease:"none",


scrollTrigger:{


trigger:
".gallery-section",


start:
"top top",


end:()=>{

return "+=" +
galleryTrack.scrollWidth;

},


pin:true,

scrub:1,


invalidateOnRefresh:true



}


}

);



}









/* ==========================================================
   GALLERY IMAGE KEN BURNS
   ========================================================== */


gsap.utils.toArray(
".gallery-slide img"
)
.forEach(
image=>{


gsap.to(
image,
{

scale:1.15,

ease:"none",

scrollTrigger:{

trigger:image,

scrub:true

}

}

);



}
);









/* ==========================================================
   MASONRY REVEAL
   ========================================================== */


gsap.from(
".masonry-item",
{

opacity:0,

scale:.9,

y:80,

stagger:.15,

duration:1,


scrollTrigger:{

trigger:".masonry-grid",

start:"top 80%"

}


}

);







/* ==========================================================
   PROCESS CARDS
   ========================================================== */


gsap.from(
".process-card",
{

opacity:0,

y:100,

rotateY:20,

stagger:.15,

duration:1,


scrollTrigger:{

trigger:".process-grid",

start:"top 80%"

}


}

);

/* ==========================================================
   AUTOMATIC CINEMATIC GALLERY CROSSFADE
   ========================================================== */


const gallerySlides =
document.querySelectorAll(
".gallery-slide"
);



let currentSlide = 0;



function changeGallerySlide(){


if(!gallerySlides.length) return;



gallerySlides.forEach(
(slide,index)=>{


slide.classList.remove(
"active"
);


gsap.to(
slide,
{

opacity:0,

duration:1,

ease:"power2.out"

}

);



}
);



currentSlide =
(currentSlide + 1)
%
gallerySlides.length;



const nextSlide =
gallerySlides[currentSlide];



nextSlide.classList.add(
"active"
);



gsap.fromTo(
nextSlide,
{

opacity:0,

scale:1.05


},

{

opacity:1,

scale:1,

duration:1.5,

ease:"power3.out"

}

);



gsap.to(
".progress-bar",
{

width:"100%",

duration:15,

ease:"linear",

onComplete:()=>{

gsap.set(
".progress-bar",
{
width:0
}
);

}

}

);



}



if(gallerySlides.length){


gallerySlides.forEach(
slide=>{


gsap.set(
slide,
{

opacity:
slide.classList.contains("active")
?1
:0

}
);


}
);



setInterval(
changeGallerySlide,
15000
);



}








/* ==========================================================
   GLASS REFLECTION EFFECT
   ========================================================== */


document.querySelectorAll(
".glass-card"
)
.forEach(
card=>{


card.addEventListener(
"mousemove",
(e)=>{


const rect =
card.getBoundingClientRect();



const x =
e.clientX - rect.left;



const y =
e.clientY - rect.top;



card.style.setProperty(
"--mouse-x",
`${x}px`
);



card.style.setProperty(
"--mouse-y",
`${y}px`
);



}
);



}
);








/* ==========================================================
   BUTTON RIPPLE EFFECT
   ========================================================== */


document.querySelectorAll(
".primary-button"
)
.forEach(
button=>{


button.addEventListener(
"mouseenter",
(e)=>{


const circle =
document.createElement(
"span"
);



const rect =
button.getBoundingClientRect();



circle.style.left =
`${e.clientX - rect.left}px`;



circle.style.top =
`${e.clientY - rect.top}px`;



button.appendChild(
circle
);



gsap.to(
circle,
{

width:300,

height:300,

duration:.8,

opacity:0,

ease:"power2.out",

onComplete:()=>{

circle.remove();

}

}

);



}
);



}
);








/* ==========================================================
   MOBILE MENU
   ========================================================== */


const menuButton =
document.querySelector(
".menu-toggle"
);



const navLinks =
document.querySelector(
".nav-links"
);



if(menuButton){


menuButton.addEventListener(
"click",
()=>{


const expanded =
menuButton.getAttribute(
"aria-expanded"
)
===
"true";



menuButton.setAttribute(
"aria-expanded",
!expanded
);



navLinks.classList.toggle(
"open"
);



}
);



}







/* ==========================================================
   IMAGE LAZY LOAD OBSERVER
   ========================================================== */


const lazyImages =
document.querySelectorAll(
"img[loading='lazy']"
);



const imageObserver =
new IntersectionObserver(
(entries,observer)=>{


entries.forEach(
entry=>{


if(entry.isIntersecting){


const image =
entry.target;



image.style.opacity=1;



observer.unobserve(
image
);



}



}
);



},
{

rootMargin:
"200px"

}

);



lazyImages.forEach(
image=>{

image.style.opacity=0;

image.style.transition=
"opacity 1s ease";


imageObserver.observe(
image
);


}
);









/* ==========================================================
   SCROLL BASED SECTION MORPHING
   ========================================================== */


gsap.utils.toArray(
".section"
)
.forEach(
section=>{


gsap.fromTo(
section,
{

borderRadius:"0px"

},

{

borderRadius:"40px",

scrollTrigger:{

trigger:section,

start:"top bottom",

end:"top center",

scrub:true

}

}

);



}
);









/* ==========================================================
   KEYBOARD LIGHTBOX
   ========================================================== */


const lightbox =
document.createElement(
"div"
);



lightbox.className =
"lightbox";



document.body.appendChild(
lightbox
);



const lightboxImage =
document.createElement(
"img"
);



lightbox.appendChild(
lightboxImage
);



document.querySelectorAll(
".masonry-item img,.gallery-slide img"
)
.forEach(
image=>{


image.addEventListener(
"click",
()=>{


lightboxImage.src =
image.src;



lightbox.classList.add(
"active"
);



}
);



}
);



lightbox.addEventListener(
"click",
()=>{


lightbox.classList.remove(
"active"
);



}
);



document.addEventListener(
"keydown",
(e)=>{


if(e.key==="Escape"){

lightbox.classList.remove(
"active"
);

}


}
);








/* ==========================================================
   RESIZE REFRESH
   ========================================================== */


window.addEventListener(
"resize",
()=>{


ScrollTrigger.refresh();



}
);








/* ==========================================================
   INITIAL REFRESH
   ========================================================== */


window.addEventListener(
"load",
()=>{


ScrollTrigger.refresh();



});