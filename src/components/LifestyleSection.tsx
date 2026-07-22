import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel, { EmblaCarouselType } from "embla-carousel-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Video from "yet-another-react-lightbox/plugins/video";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LifestyleItem {
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
}

interface LifestyleSectionProps {
  lifestyle: LifestyleItem[];
}

const LifestyleSection: React.FC<LifestyleSectionProps> = ({ lifestyle }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  const baseURL = import.meta.env.VITE_BACKEND_URL;

  // Lightbox slides (mixed media)
  const lightboxAssets = lifestyle.map((item) => {
    console.log("item type", item.type);

    const src = `${baseURL}${item.url}`;

    console.log("src", src);
    return item.type === "video"
      ? {
          type: "video",
          playsInline: true,
          poster: src + "?frame=1",
          sources: [{ src, type: "video/mp4" }],
          autoPlay: true,
          controlsList: "nodownload",
        }
      : { type: "image", src };
  });

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect(emblaApi);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      onSelect(emblaApi);
    });
  }, [emblaApi, onSelect]);

  return (
    <div className="mt-10 md:px-8 w-full relative">
      <h2 className="text-xl font-medium uppercase mb-5 text-customNavy">
        Location & Lifestyle
      </h2>

      {/* Embla Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 mb-2.5 ">
          {lifestyle.map((item, i) => (
            <div
              key={i}
              className="flex-[0_0_auto] w-full md:w-[400px] cursor-pointer bg-white rounded-xl overflow-hidden shadow-md transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => {
                setSelectedIndex(i);
                setOpen(true);
              }}
            >
              <div className="w-full">
                {item.type === "image" && (
                  <img
                    src={`${baseURL}${item.url}`}
                    alt={item.title}
                    className="w-full h-52 object-cover"
                  />
                )}
                {item.type === "video" && (
                  <video
                    src={`${baseURL}${item.url}`}
                    className="w-full h-52 object-cover"
                    muted
                    controls
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="font-medium text-black mb-1">{item.title}</div>
                <div className="text-black text-sm">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot Progress Bar */}
      <div className="mt-3 flex w-full rounded-full overflow-hidden">
        {scrollSnaps.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`h-2.5 flex-1 transition-all duration-300 ${
              i <= selectedIndex ? "bg-customNavy" : "bg-customWhite"
            }`}
          />
        ))}
      </div>

      {/* Arrows bottom right */}
      <div className="relative mt-5 justify-center md:mt-0 md:absolute md:-top-1 right-2 flex gap-2">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="p-2 rounded-full bg-customPutty shadow hover:bg-customOrange"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="p-2 rounded-full bg-customPutty shadow hover:bg-customOrange"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Lightbox with mixed media */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={lightboxAssets}
        index={selectedIndex}
        plugins={[Thumbnails, Video]}
        on={{
          view: ({ index: currentIndex }) => setSelectedIndex(currentIndex),
        }}
      />
    </div>
  );
};

export default LifestyleSection;
