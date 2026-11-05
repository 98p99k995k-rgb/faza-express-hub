import { useEffect, useState } from "react";
import { fetchGooglePlacePhoto } from "@/lib/google-places";
import type { PlacePhoto } from "@/lib/places";
import { useTranslation } from "@/lib/useTranslation";

export function PlacePhoto({
  photo,
  alt,
  className,
}: {
  photo?: PlacePhoto;
  alt: string;
  className: string;
}) {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!photo?.name) {
      setImageUrl("");
      setLoading(false);
      setFailed(false);
      return;
    }
    const controller = new AbortController();
    let objectUrl = "";
    setLoading(true);
    setFailed(false);
    setImageUrl("");
    void fetchGooglePlacePhoto(photo.name, controller.signal)
      .then((url) => {
        objectUrl = url;
        setImageUrl(url);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo?.name, retry]);

  if (!photo?.name) {
    return (
      <div className={`${className} grid place-items-center bg-secondary px-3 text-center`}>
        <span className="text-xs font-semibold text-muted-foreground">
          {t("لا توجد صورة متاحة")}
        </span>
      </div>
    );
  }

  return (
    <figure className="min-w-0">
      {failed ? (
        <div className={`${className} grid place-items-center gap-2 bg-secondary px-3 text-center`}>
          <span className="text-xs font-semibold text-muted-foreground">
            {t("تعذر تحميل الصورة")}
          </span>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="text-xs font-bold text-primary underline"
          >
            {t("إعادة المحاولة")}
          </button>
        </div>
      ) : loading || !imageUrl ? (
        <div className={`${className} grid place-items-center bg-secondary`}>
          <span className="text-xs text-muted-foreground">{t("جارٍ تحميل الصورة...")}</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={className}
        />
      )}
      {photo.authorAttributions.length > 0 && (
        <figcaption className="mt-1 truncate text-[10px] text-muted-foreground">
          {t("صورة بواسطة")}{" "}
          {photo.authorAttributions.map((author, index) => (
            <span key={`${author.displayName}-${index}`}>
              {index > 0 ? ", " : ""}
              {author.uri ? (
                <a href={author.uri} target="_blank" rel="noreferrer" className="underline">
                  {author.displayName}
                </a>
              ) : (
                author.displayName
              )}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
