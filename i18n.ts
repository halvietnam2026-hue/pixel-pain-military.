export type Lang = "en" | "vi" | "ru" | "th" | "el" | "es";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English (USA)", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "es", label: "Español (México)", flag: "🇲🇽" },
];

const en = {
  subtitle: "COLOR BY NUMBER", play: "PLAY", chooseLevel: "LEVELS", level: "LEVEL", missions: "MISSIONS",
  allCleared: "★ ALL CLEARED — PLAY AGAIN ★", unlockHint: "Complete a level to unlock the next one",
  done: "DONE", colors: "colors", page: "Page {a}/{b}", goTo: "Go to level", jump: "GO", current: "CURRENT",
  settings: "SETTINGS", sound: "SOUND", soundDesc: "Taps, coins, error beeps", vibrate: "VIBRATION", vibrateDesc: "Buzz on a wrong tap",
  autoNext: "AUTO NEXT LEVEL", autoNextDesc: "Jump to the next level when done", highlight: "HIGHLIGHT CELLS", highlightDesc: "Brighten cells of the selected color",
  music: "MUSIC", musicDesc: "Chill background tracks", nextTrack: "NEXT TRACK", language: "LANGUAGE",
  repaint: "REPAINT", menu: "MENU", resetAll: "RESET ALL PROGRESS", resetConfirm: "You will lose all coins & levels. Sure?", cancel: "CANCEL", delete: "DELETE",
  contact: "CONTACT THE DEV", copied: "Copied!",
  loading: "LOADING MAP...", loadError: "COULD NOT LOAD IMAGE", needCoins: "Need {n} coins for a hint!", colorRemain: "Color {n} · {m} left", pickColor: "Pick a color to paint",
  missionComplete: "MISSION COMPLETE", allDoneTitle: "GAME CLEARED!", perfectBonus: "No mistakes: +{n} bonus!", finishedAll: "You cleared every mission. Legendary!", hint: "HINT",
  lv_helmet: "HELMET", lv_grenade: "GRENADE", lv_tank: "TANK", lv_heli: "HELICOPTER", lv_jet: "FIGHTER JET", lv_creature: "CREATURE", lv_mandala: "MANDALA",
  lv_landscape: "LANDSCAPE", lv_emblem: "EMBLEM", lv_pattern: "PATTERN", lv_plane: "AIRPLANE", lv_ship: "WARSHIP", lv_circuit: "CIRCUIT", lv_flag: "FLAG", lv_robot: "ROBOT", lv_flower: "FLOWER",
};
export type TKey = keyof typeof en;

const vi: Record<TKey, string> = {
  subtitle: "TÔ MÀU THEO SỐ", play: "CHƠI", chooseLevel: "CHỌN MÀN", level: "LEVEL", missions: "NHIỆM VỤ",
  allCleared: "★ ĐÃ PHÁ ĐẢO — CHƠI LẠI ★", unlockHint: "Hoàn thành màn trước để mở màn sau",
  done: "XONG", colors: "màu", page: "Trang {a}/{b}", goTo: "Đến màn", jump: "ĐI", current: "HIỆN TẠI",
  settings: "CÀI ĐẶT", sound: "ÂM THANH", soundDesc: "Tiếng tô, coin, báo lỗi", vibrate: "RUNG", vibrateDesc: "Rung khi tô sai",
  autoNext: "TỰ CHUYỂN MÀN", autoNextDesc: "Xong màn tự sang màn tiếp", highlight: "TÔ SÁNG Ô", highlightDesc: "Làm nổi ô của màu đang chọn",
  music: "NHẠC NỀN", musicDesc: "Nhạc chill nhẹ nhàng", nextTrack: "BÀI TIẾP", language: "NGÔN NGỮ",
  repaint: "TÔ LẠI", menu: "MENU", resetAll: "XOÁ TOÀN BỘ TIẾN TRÌNH", resetConfirm: "Mất hết coin & màn chơi. Chắc chắn?", cancel: "HUỶ", delete: "XOÁ",
  contact: "LIÊN HỆ TÁC GIẢ", copied: "Đã sao chép!",
  loading: "ĐANG TẢI BẢN ĐỒ...", loadError: "KHÔNG TẢI ĐƯỢC ẢNH", needCoins: "Cần {n} coin để gợi ý!", colorRemain: "Màu số {n} · còn {m} ô", pickColor: "Chọn 1 màu để tô",
  missionComplete: "NHIỆM VỤ HOÀN THÀNH", allDoneTitle: "PHÁ ĐẢO!", perfectBonus: "Không sai ô nào: +{n} thưởng!", finishedAll: "Bạn đã hoàn thành mọi nhiệm vụ. Huyền thoại!", hint: "GỢI Ý",
  lv_helmet: "MŨ SẮT", lv_grenade: "LỰU ĐẠN", lv_tank: "XE TĂNG", lv_heli: "TRỰC THĂNG", lv_jet: "CHIẾN ĐẤU CƠ", lv_creature: "SINH VẬT", lv_mandala: "MANDALA",
  lv_landscape: "PHONG CẢNH", lv_emblem: "HUY HIỆU", lv_pattern: "HOẠ TIẾT", lv_plane: "MÁY BAY", lv_ship: "TÀU CHIẾN", lv_circuit: "MẠCH ĐIỆN", lv_flag: "LÁ CỜ", lv_robot: "ROBOT", lv_flower: "BÔNG HOA",
};

const ru: Record<TKey, string> = {
  subtitle: "РАСКРАСКА ПО НОМЕРАМ", play: "ИГРАТЬ", chooseLevel: "УРОВНИ", level: "УРОВЕНЬ", missions: "МИССИЙ",
  allCleared: "★ ВСЁ ПРОЙДЕНО — ИГРАТЬ СНОВА ★", unlockHint: "Пройдите уровень, чтобы открыть следующий",
  done: "ГОТОВО", colors: "цветов", page: "Стр. {a}/{b}", goTo: "К уровню", jump: "ОК", current: "ТЕКУЩИЙ",
  settings: "НАСТРОЙКИ", sound: "ЗВУК", soundDesc: "Клики, монеты, ошибки", vibrate: "ВИБРАЦИЯ", vibrateDesc: "Вибрация при ошибке",
  autoNext: "АВТОПЕРЕХОД", autoNextDesc: "Сразу к следующему уровню", highlight: "ПОДСВЕТКА", highlightDesc: "Подсветить клетки выбранного цвета",
  music: "МУЗЫКА", musicDesc: "Спокойные фоновые треки", nextTrack: "СЛЕД. ТРЕК", language: "ЯЗЫК",
  repaint: "ЗАНОВО", menu: "МЕНЮ", resetAll: "СБРОСИТЬ ПРОГРЕСС", resetConfirm: "Вы потеряете монеты и уровни. Точно?", cancel: "ОТМЕНА", delete: "УДАЛИТЬ",
  contact: "СВЯЗЬ С АВТОРОМ", copied: "Скопировано!",
  loading: "ЗАГРУЗКА КАРТЫ...", loadError: "НЕ УДАЛОСЬ ЗАГРУЗИТЬ", needCoins: "Нужно {n} монет для подсказки!", colorRemain: "Цвет {n} · осталось {m}", pickColor: "Выберите цвет",
  missionComplete: "МИССИЯ ВЫПОЛНЕНА", allDoneTitle: "ИГРА ПРОЙДЕНА!", perfectBonus: "Без ошибок: бонус +{n}!", finishedAll: "Все миссии пройдены. Легенда!", hint: "ПОДСКАЗКА",
  lv_helmet: "КАСКА", lv_grenade: "ГРАНАТА", lv_tank: "ТАНК", lv_heli: "ВЕРТОЛЁТ", lv_jet: "ИСТРЕБИТЕЛЬ", lv_creature: "СУЩЕСТВО", lv_mandala: "МАНДАЛА",
  lv_landscape: "ПЕЙЗАЖ", lv_emblem: "ЭМБЛЕМА", lv_pattern: "УЗОР", lv_plane: "САМОЛЁТ", lv_ship: "КОРАБЛЬ", lv_circuit: "СХЕМА", lv_flag: "ФЛАГ", lv_robot: "РОБОТ", lv_flower: "ЦВЕТОК",
};

const th: Record<TKey, string> = {
  subtitle: "ระบายสีตามตัวเลข", play: "เล่น", chooseLevel: "ด่าน", level: "ด่าน", missions: "ภารกิจ",
  allCleared: "★ ผ่านหมดแล้ว — เล่นอีกครั้ง ★", unlockHint: "ผ่านด่านก่อนหน้าเพื่อปลดล็อกด่านถัดไป",
  done: "เสร็จ", colors: "สี", page: "หน้า {a}/{b}", goTo: "ไปด่าน", jump: "ไป", current: "ปัจจุบัน",
  settings: "ตั้งค่า", sound: "เสียง", soundDesc: "เสียงแตะ เหรียญ และผิดพลาด", vibrate: "สั่น", vibrateDesc: "สั่นเมื่อแตะผิด",
  autoNext: "ไปด่านถัดไปอัตโนมัติ", autoNextDesc: "ผ่านแล้วไปด่านต่อไปทันที", highlight: "ไฮไลต์ช่อง", highlightDesc: "เน้นช่องของสีที่เลือก",
  music: "เพลง", musicDesc: "เพลงพื้นหลังชิล ๆ", nextTrack: "เพลงถัดไป", language: "ภาษา",
  repaint: "ระบายใหม่", menu: "เมนู", resetAll: "ล้างความคืบหน้าทั้งหมด", resetConfirm: "เหรียญและด่านจะหายทั้งหมด แน่ใจไหม?", cancel: "ยกเลิก", delete: "ลบ",
  contact: "ติดต่อผู้พัฒนา", copied: "คัดลอกแล้ว!",
  loading: "กำลังโหลดแผนที่...", loadError: "โหลดรูปไม่ได้", needCoins: "ต้องใช้ {n} เหรียญเพื่อขอคำใบ้!", colorRemain: "สีที่ {n} · เหลือ {m} ช่อง", pickColor: "เลือกสีเพื่อระบาย",
  missionComplete: "ภารกิจสำเร็จ", allDoneTitle: "ผ่านเกมแล้ว!", perfectBonus: "ไม่ผิดเลย: โบนัส +{n}!", finishedAll: "คุณผ่านทุกภารกิจแล้ว สุดยอด!", hint: "คำใบ้",
  lv_helmet: "หมวกเหล็ก", lv_grenade: "ระเบิดมือ", lv_tank: "รถถัง", lv_heli: "เฮลิคอปเตอร์", lv_jet: "เครื่องบินรบ", lv_creature: "สัตว์ประหลาด", lv_mandala: "มันดาลา",
  lv_landscape: "ทิวทัศน์", lv_emblem: "ตราสัญลักษณ์", lv_pattern: "ลวดลาย", lv_plane: "เครื่องบิน", lv_ship: "เรือรบ", lv_circuit: "วงจร", lv_flag: "ธง", lv_robot: "หุ่นยนต์", lv_flower: "ดอกไม้",
};

const el: Record<TKey, string> = {
  subtitle: "ΧΡΩΜΑΤΙΣΜΟΣ ΜΕ ΑΡΙΘΜΟΥΣ", play: "ΠΑΙΞΕ", chooseLevel: "ΕΠΙΠΕΔΑ", level: "ΕΠΙΠΕΔΟ", missions: "ΑΠΟΣΤΟΛΕΣ",
  allCleared: "★ ΟΛΑ ΟΛΟΚΛΗΡΩΘΗΚΑΝ — ΞΑΝΑ ★", unlockHint: "Ολοκλήρωσε ένα επίπεδο για να ξεκλειδώσεις το επόμενο",
  done: "ΕΓΙΝΕ", colors: "χρώματα", page: "Σελ. {a}/{b}", goTo: "Πήγαινε στο", jump: "ΠΑΜΕ", current: "ΤΡΕΧΟΝ",
  settings: "ΡΥΘΜΙΣΕΙΣ", sound: "ΗΧΟΣ", soundDesc: "Ήχοι αφής, νομισμάτων, λάθους", vibrate: "ΔΟΝΗΣΗ", vibrateDesc: "Δόνηση σε λάθος",
  autoNext: "ΑΥΤΟΜΑΤΟ ΕΠΟΜΕΝΟ", autoNextDesc: "Μετάβαση στο επόμενο επίπεδο", highlight: "ΕΠΙΣΗΜΑΝΣΗ", highlightDesc: "Φώτισε τα κελιά του επιλεγμένου χρώματος",
  music: "ΜΟΥΣΙΚΗ", musicDesc: "Χαλαρά κομμάτια υπόκρουσης", nextTrack: "ΕΠΟΜΕΝΟ", language: "ΓΛΩΣΣΑ",
  repaint: "ΞΑΝΑ", menu: "ΜΕΝΟΥ", resetAll: "ΕΠΑΝΑΦΟΡΑ ΠΡΟΟΔΟΥ", resetConfirm: "Θα χάσεις νομίσματα & επίπεδα. Σίγουρα;", cancel: "ΑΚΥΡΟ", delete: "ΔΙΑΓΡΑΦΗ",
  contact: "ΕΠΙΚΟΙΝΩΝΙΑ", copied: "Αντιγράφηκε!",
  loading: "ΦΟΡΤΩΣΗ ΧΑΡΤΗ...", loadError: "ΑΠΟΤΥΧΙΑ ΦΟΡΤΩΣΗΣ", needCoins: "Χρειάζεσαι {n} νομίσματα για βοήθεια!", colorRemain: "Χρώμα {n} · {m} απομένουν", pickColor: "Διάλεξε χρώμα",
  missionComplete: "ΑΠΟΣΤΟΛΗ ΟΛΟΚΛΗΡΩΘΗΚΕ", allDoneTitle: "ΤΕΛΟΣ ΠΑΙΧΝΙΔΙΟΥ!", perfectBonus: "Χωρίς λάθη: μπόνους +{n}!", finishedAll: "Ολοκλήρωσες κάθε αποστολή. Θρύλος!", hint: "ΒΟΗΘΕΙΑ",
  lv_helmet: "ΚΡΑΝΟΣ", lv_grenade: "ΧΕΙΡΟΒΟΜΒΙΔΑ", lv_tank: "ΤΑΝΚ", lv_heli: "ΕΛΙΚΟΠΤΕΡΟ", lv_jet: "ΜΑΧΗΤΙΚΟ", lv_creature: "ΠΛΑΣΜΑ", lv_mandala: "ΜΑΝΤΑΛΑ",
  lv_landscape: "ΤΟΠΙΟ", lv_emblem: "ΕΜΒΛΗΜΑ", lv_pattern: "ΜΟΤΙΒΟ", lv_plane: "ΑΕΡΟΠΛΑΝΟ", lv_ship: "ΠΛΟΙΟ", lv_circuit: "ΚΥΚΛΩΜΑ", lv_flag: "ΣΗΜΑΙΑ", lv_robot: "ΡΟΜΠΟΤ", lv_flower: "ΛΟΥΛΟΥΔΙ",
};

const es: Record<TKey, string> = {
  subtitle: "COLOREA POR NÚMEROS", play: "JUGAR", chooseLevel: "NIVELES", level: "NIVEL", missions: "MISIONES",
  allCleared: "★ TODO COMPLETADO — JUGAR OTRA VEZ ★", unlockHint: "Completa un nivel para desbloquear el siguiente",
  done: "LISTO", colors: "colores", page: "Pág. {a}/{b}", goTo: "Ir al nivel", jump: "IR", current: "ACTUAL",
  settings: "AJUSTES", sound: "SONIDO", soundDesc: "Toques, monedas y errores", vibrate: "VIBRACIÓN", vibrateDesc: "Vibrar al equivocarte",
  autoNext: "SIGUIENTE AUTOMÁTICO", autoNextDesc: "Pasar al siguiente nivel al terminar", highlight: "RESALTAR CELDAS", highlightDesc: "Iluminar celdas del color elegido",
  music: "MÚSICA", musicDesc: "Pistas de fondo relajadas", nextTrack: "SIGUIENTE PISTA", language: "IDIOMA",
  repaint: "REPINTAR", menu: "MENÚ", resetAll: "BORRAR TODO EL PROGRESO", resetConfirm: "Perderás monedas y niveles. ¿Seguro?", cancel: "CANCELAR", delete: "BORRAR",
  contact: "CONTACTA AL DEV", copied: "¡Copiado!",
  loading: "CARGANDO MAPA...", loadError: "NO SE PUDO CARGAR", needCoins: "¡Necesitas {n} monedas para una pista!", colorRemain: "Color {n} · faltan {m}", pickColor: "Elige un color",
  missionComplete: "MISIÓN CUMPLIDA", allDoneTitle: "¡JUEGO COMPLETADO!", perfectBonus: "Sin errores: ¡bono +{n}!", finishedAll: "Completaste todas las misiones. ¡Leyenda!", hint: "PISTA",
  lv_helmet: "CASCO", lv_grenade: "GRANADA", lv_tank: "TANQUE", lv_heli: "HELICÓPTERO", lv_jet: "CAZA", lv_creature: "CRIATURA", lv_mandala: "MANDALA",
  lv_landscape: "PAISAJE", lv_emblem: "EMBLEMA", lv_pattern: "PATRÓN", lv_plane: "AVIÓN", lv_ship: "BARCO", lv_circuit: "CIRCUITO", lv_flag: "BANDERA", lv_robot: "ROBOT", lv_flower: "FLOR",
};

const T: Record<Lang, Record<TKey, string>> = { en, vi, ru, th, el, es };

export function tr(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = (T[lang] ?? en)[key as TKey] ?? en[key as TKey] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}
