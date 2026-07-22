import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel, { EmblaCarouselType } from "embla-carousel-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyImagesProps {
  images: { url: string }[];
}

const PropertyImages: React.FC<PropertyImagesProps> = ({ images }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  const lightboxImages = images.map((img) => ({ src: img.url }));

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
    <div className="w-full relative">
      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {images.map((image, i) => (
            <div
              key={i}
              className="flex-[0_0_auto] w-full md:w-[350px] cursor-pointer"
              onClick={() => {
                setOpen(true);
              }}
            >
              <img
                src={image.url}
                alt={`Property ${i + 1}`}
                className="h-64 w-full object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dot Progress Bar */}
      <div className="mt-4 flex w-full rounded-full overflow-hidden">
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
      <div className="relative md:absolute -bottom-5 md:-bottom-16 right-2 flex gap-2 justify-center">
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

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={lightboxImages}
        index={selectedIndex}
        plugins={[Thumbnails, Zoom]}
        on={{
          view: ({ index: currentIndex }) => setSelectedIndex(currentIndex),
        }}
      />
    </div>
  );
};

export default PropertyImages;
