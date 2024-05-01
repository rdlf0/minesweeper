export class MobileUtil {

    public static isMobile(): boolean {
        return /iPhone|Android/i.test(navigator.userAgent);
    }

}