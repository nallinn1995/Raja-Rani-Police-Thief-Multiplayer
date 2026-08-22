export interface AvatarPreset {
  id: string;
  name: string;
  src: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  { id: "1", name: "Police", src: "/assets/images/avatars/17862878472668.png" },
  { id: "2", name: "Thief", src: "/assets/images/avatars/17862892522463.png" },
  { id: "3", name: "Raja", src: "/assets/images/avatars/1786289456b252.png" },
  { id: "4", name: "Rani", src: "/assets/images/avatars/17862925585f2a.png" },
  { id: "5", name: "Detective", src: "/assets/images/avatars/1786292646bff1.png" },
  { id: "6", name: "Crown", src: "/assets/images/avatars/17862927087f70.png" },
];

export const getAvatarSrc = (avatarId?: string): string => {
  if (!avatarId) return PRESET_AVATARS[0].src;
  if (avatarId.startsWith("/") || avatarId.startsWith("http")) return avatarId;
  const found = PRESET_AVATARS.find((av) => av.id === avatarId);
  return found ? found.src : PRESET_AVATARS[0].src;
};
