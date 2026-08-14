import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/** No-ops silently on web and on devices without a haptics engine. */
export async function hapticSuccess() {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Unavailable — silent no-op.
  }
}

export async function hapticTap() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Unavailable — silent no-op.
  }
}
