import { config } from "../../package.json";
import { isConnected } from "../addon";
import { getPref, Option, optionsLoad } from "../utils/prefs";
import { api_setActionState, onDomContentLoaded } from "./frame";
import { getSentence } from "./text";

const READER_CSS_ID = "zodh-reader-css";

/**
 * Inject all ODH popup styles as an inline <style> element.
 *
 * We CANNOT use a <link> to chrome:// because the reader page is served from
 * resource://zotero and Firefox blocks cross-protocol stylesheet loads.
 * Inline <style> is allowed and is the standard approach for Zotero reader plugins.
 */
function ensureReaderStylesheet(doc: Document) {
  if (doc.getElementById(READER_CSS_ID)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = READER_CSS_ID;
  style.textContent = `
    #odh-popup {
      all: initial;
      background-color: transparent;
      height: 300px;
      resize: both;
      width: 400px;
      z-index: 2147483647;
      overflow-y: scroll;
      display: block;
      visibility: hidden;
      max-height: 70vh;
    }

    #odh-popup .odh-notes {
      font-family: "Open Sans", Helvetica, Arial, "Microsoft Yahei", sans-serif;
      font-size: 14px;
      text-align: left;
      color: #1d2129;
      line-height: 1.5em;
      min-height: 1.5em;
      overflow-y: auto;
      margin: 8px;
      border-radius: 3px;
      box-sizing: border-box;
    }

    #odh-popup .odh-note {
      margin: 5px 0;
      padding: 0px;
    }

    #odh-popup .odh-headsection {
      margin: 3px 0;
      padding: 0 3px 3px;
      border-bottom: 2px #666 solid;
    }

    #odh-popup .odh-expression {
      font-size: 1.2em;
      font-weight: bold;
      margin-right: 4px;
      letter-spacing: 0.01em;
    }

    #odh-popup .odh-reading {
      font-family: Arial, Helvetica, sans-serif;
      margin-right: 4px;
      font-size: 0.9em;
      display: inline-block;
    }

    #odh-popup .odh-extra {
      margin-right: 4px;
      display: inline-block;
    }

    #odh-popup .odh-definition {
      display: block;
      background-color: #fefefe;
      border: 1px solid;
      border-color: #e5e6e9 #dfe0e4 #d0d1d5;
      border-radius: 6px;
      padding: 5px;
      margin-top: 5px;
      word-wrap: break-word;
      overflow: auto;
    }

    #odh-popup .odh-definition:hover {
      background-color: #f7fafc;
    }

    #odh-popup .odh-sentence {
      display: block;
      background-color: #fefefe;
      border: 2px dashed #d0d1d5;
      border-radius: 3px;
      padding: 0;
      margin-top: 5px;
      word-wrap: break-word;
      overflow: auto;
    }

    #odh-popup .odh-context {
      font-family: "Open Sans", Helvetica, Arial, "Microsoft Yahei", sans-serif;
      background: #fffff4;
      margin: 0;
      width: 96%;
      height: 100px;
    }

    #odh-popup .odh-addnote {
      margin: 3px;
      cursor: pointer;
      position: relative;
      float: right;
      width: 16px;
      height: 16px;
    }

    #odh-popup .odh-addnote-disabled {
      margin: 3px;
      cursor: not-allowed;
      position: relative;
      float: right;
      width: 16px;
      height: 16px;
      opacity: 0.5;
    }

    #odh-popup .odh-addnote-plus {
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJvSURBVDjLpZPrS5NhGIf9W7YvBYOkhlkoqCklWChv2WyKik7blnNris72bi6dus0DLZ0TDxW1odtopDs4D8MDZuLU0kXq61CijSIIasOvv94VTUfLiB74fXngup7nvrnvJABJ/5PfLnTTdcwOj4RsdYmo5glBWP6iOtzwvIKSWstI0Wgx80SBblpKtE9KQs/We7EaWoT/8wbWP61gMmCH0lMDvokT4j25TiQU/ITFkek9Ow6+7WH2gwsmahCPdwyw75uw9HEO2gUZSkfyI9zBPCJOoJ2SMmg46N61YO/rNoa39Xi41oFuXysMfh36/Fp0b7bAfWAH6RGi0HglWNCbzYgJaFjRv6zGuy+b9It96N3SQvNKiV9HvSaDfFEIxXItnPs23BzJQd6DDEVM0OKsoVwBG/1VMzpXVWhbkUM2K4oJBDYuGmbKIJ0qxsAbHfRLzbjcnUbFBIpx/qH3vQv9b3U03IQ/HfFkERTzfFj8w8jSpR7GBE123uFEYAzaDRIqX/2JAtJbDat/COkd7CNBva2cMvq0MGxp0PRSCPF8BXjWG3FgNHc9XPT71Ojy3sMFdfJRCeKxEsVtKwFHwALZfCUk3tIfNR8XiJwc1LmL4dg141JPKtj3WUdNFJqLGFVPC4OkR4BxajTWsChY64wmCnMxsWPCHcutKBxMVp5mxA1S+aMComToaqTRUQknLTH62kHOVEE+VQnjahscNCy0cMBWsSI0TCQcZc5ALkEYckL5A5noWSBhfm2AecMAjbcRWV0pUTh0HE64TNf0mczcnnQyu/MilaFJCae1nw2fbz1DnVOxyGTlKeZft/Ff8x1BRssfACjTwQAAAABJRU5ErkJggg==) no-repeat;
    }

    #odh-popup .odh-addnote-cloud {
      background: url("chrome://zodh/content/fg/img/cloud.png") no-repeat;
    }

    #odh-popup .odh-addnote-load {
      background: url("chrome://zodh/content/fg/img/load.gif") no-repeat;
    }

    #odh-popup .odh-addnote-good {
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACcUlEQVQ4jZVR30tTcRw99/u9P5x36s1fA5d1lZWYpTdfCtRtiQmbmflWgTF78qnsL7D9BfPFBymSwEgjKE3QCKYPRmWml0TIDF1mc0NzVzc3NnW3hzBERul5/HDO+ZzP+TA4CrohE4Z08JSXBcr7eMrdY48glghDRq/JTtksFmB5y4+Pa1MyOayeMrT9krlGtpmrYUwzwH68Bpl8uv1QCbgHrCJyYodTrsf32AIAQGeSAAgOlYAlrOdW6XXwHIuoHkFZdjk+rargCNf5X4P0RwZXaXaJvdKk4GdiCeXZlQhEg5j5NeujhLr/nNAFBQQKGKhog7onzugxSoQhHlfZTYSTGnINeRA5I57NvQBL2NbJJlUj6ILHIhVNO07W9eSkHZtGNzz7ivM0WZxSrpiDLYRRnHEK71cmEN2Jdk42qWMAwIJB++2yFhg4AZflWvTO9bfPPvwiiZzhcX56nuuqpQGBnWVYMkrgj6xgKqj6KEPde0sIGMDIi1hLrGJzN4Q759tgL6xyUUJHW8+1YIckIPIiOMJj6NswKKHN7xontb8p0QgplNAu2s1WxPUY4noMtkIbiiUZFaaz2MA6ThiK4PWNYUHzud9emejbXzLFEF77awPy5vamYjNbEUcca7tBVORUIIwN5KeZ4A8HMPR1WB1v+HDj4JcoAOiv9IFQvSZHtiNKdUEVCGWwmgwik8+CgYjo/fwU28mEw/fkRyClAQDEXyYGYo6YPB+aV6zmGmQJmcgTTPAujmFBW3R7HeN9B8Upceb56R7nmzp9cL1f717q1OtGrNP/4jOphhcGK+8LVLgrUF6jhDaP1HvVVDwA+A0rr9F+/wY4EQAAAABJRU5ErkJggg==) no-repeat;
    }

    #odh-popup .odh-addnote-fail {
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACpElEQVR4nHWTTU8TQRzGn5n/rNtXuxVoWbSmJcYXwGQuFBNP+w0w8AEkPXHDT4LfoF7lAL6QXiDZIF4IlyXeCVEogqFu6Yvbmtnx4LIRo//jJL/fMzPPDEM0Xq22OvT9cvPjx6X5szMf/5gN27bsubm6Gg6PnjYaLwCAA8Cn5eV6YXZ2hTM2nxoddd+Mj1v/gV3r3r153WqtbD16VAcA5tVqq4XZ2ZXm1haGrRa0Uuien3v9dtt5dnrqA8D6xIRlV6tufnJSXuzsQisFAOj3ei/F0PfLze3tGIZSSOfzEmHorgMOGINdrbr5SkVe7OwASoFFuwqVKrO3xaKVHB110yMjEkpBhyGgFBCG6LbbXm5qCrcqFXnx4cPvda3BAFz2+16333cYALwZH7eSluWm83l5BbMwBMIQt548gb+3FyczreH3+143CJyFkxOf/XlJqWzWTd+8Ka9gpjX0YAAdBGBRclcI7zIInMWTEx9AfBwAwLptW6lMxs0kk1J9/w7VboMD4JyDiNAxDK8rhLN4fBzXLK51xRiylQpSponW4SEoAokIxDk4EfRf9fI/0wszM27asuTFzk6cSkQQRBBCoEgkRzh310ol65pgI4IzuZz81miAhyE4Y7FECAHDMGAIgdumKYuGEUvYhm1bY1HyeaMBrnWc2DNNj4hQIJJXAkMIEBE+B4F3HASOGJuerqdyOfl1cxNcazAiMMbQNQyvJ4SjARBj7p1IciMSPUgkJO906uJnp3N0urt7De6ZpvfDMOLbXiuVHKGUO0kkb0QSzjmSQXDEAOBdNls3BoPnRIRhOu0NTNNZiHq+mrVSybqTSrkP83mZTCTwpdd7dX9/fyl+B+9zuVUQlYeJxNJCs/nP7/z67l2rnMnUU4Zx9Pjg4AUA/ALA8B6CbeY2WQAAAABJRU5ErkJggg==) no-repeat;
    }

    #odh-popup .odh-audios {
      margin: 3px;
      position: relative;
      float: right;
    }

    #odh-popup .odh-playaudio {
      vertical-align: text-bottom;
      margin: 0 3px;
      height: 16px;
      width: 16px;
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAH0SURBVDjLxdPPS9tgGAfwgH/ATmPD0w5jMFa3IXOMFImsOKnbmCUTacW1WZM2Mf1ho6OBrohkIdJfWm9aLKhM6GF4Lz3No/+AMC/PYQXBXL1+95oxh1jGhsgOX/LywvN5n/fN+3IAuKuEuzagVFoO27b1/Z+BcrnUx4otx7FPLWsJvYpIM2SS9H4PqNWqfK1W8VKplHlW/G1zs4G9vS9YXPx4CaDkXOFES4Om4gceUK2WsbZWR72+gtXVFezsbKHVamF7ewtm/sMFgBJZhd6pvm4kDndaAo2KOmt5Gfv7X9HpdNBut9FsNmFZFgPrMHKZc4DkjHyi6KC3MZNehTOuGAH5Xx5ybK/Y3f0Mx3Fg2zaKxSIMw2DjT0inNQ84nogcUUQJHIfZquNT3hzx46DBALizg2o01qEoCqLRKERRRDAYhKYlWRK/AJdCMwH2BY28+Qk8fg667wdXKJjY2FiHaeaRzWYQCk1AEASGzSCZjP/ewtik5r6eBD0dM+nRSMb1j4LuPDnkFhZymJ/PsmLdazmV0jxEkqKsK+niIQ69mKUBwdd9OAx3SADdHtC53FyK12dVXlVlPpF4zytK7OgMyucNyHLs8m+8+2zJHRwG3fId9LxIbNU+OR6zWU57AR5y84FKN+71//EqM2iapfv/HtPf5gcdtKR8VW88PgAAAABJRU5ErkJggg==) no-repeat;
      display: inline-block;
      opacity: 0.85;
    }

    #odh-popup .odh-playaudio:hover {
      opacity: 1;
    }

    #odh-popup hr {
      border: 1px;
      margin: 5px 0;
      border-top: 1px solid #d5d5d5;
    }

    #odh-popup .hidden {
      display: none;
    }

    #odh-popup .hightlight {
      font-size: 0.9em;
      border-radius: 4px;
      color: #fff;
      padding: 1px 2px;
      margin-right: 3px;
      text-decoration: none;
      text-align: center;
    }

    #odh-popup .spell {
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(10, 10, 10, 0.25);
      box-sizing: border-box;
      width: 100%;
    }

    #odh-popup .spell-content {
      box-sizing: border-box;
      min-height: 100px;
      resize: vertical;
      outline: 0;
      overflow-y: auto;
      padding: 0.5em;
      width: 100%;
    }

    #odh-popup .spell-bar {
      display: table;
      width: 100%;
      height: 28px;
      background-color: #f6f6f6;
      box-shadow: inset 0 -1px 2px rgba(10, 10, 10, 0.1);
      border: none;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
    }

    #odh-popup .spell-zone {
      display: table-cell;
      text-align: center;
      counter-reset: btn;
    }

    #odh-popup .spell-icon {
      display: inline-block;
      position: relative;
      background-color: transparent;
      border: none;
      cursor: pointer;
      height: 22px;
      width: 22px;
      outline: 0;
      font-size: 10px;
      line-height: 0;
    }

    #odh-popup .spell-icon.selected {
      background-color: rgba(0, 0, 0, 0.1);
    }

    #odh-popup .spell-icon:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }

    #odh-popup .spell-icon[title^="heading "]::after {
      counter-increment: btn;
      content: counter(btn);
      font-size: 10px;
      vertical-align: sub;
    }

    #odh-popup .spell-icon > *:nth-child(2) {
      position: absolute;
      top: 0;
      left: 0;
      height: 30px;
      width: 30px;
      opacity: 0;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background: transparent;
      cursor: pointer;
      border: 0;
      padding: 0;
    }

    @font-face {
      font-family: "spell-icons";
      src: url("data:application/font-woff;charset=utf-8;base64,d09GRk9UVE8AABoQAAsAAAAAJZwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABDRkYgAAABCAAAFf4AAB+OVgxtP0ZGVE0AABcIAAAAGgAAABx3YkuUR0RFRgAAFyQAAAAdAAAAIABPAARPUy8yAAAXRAAAAEoAAABgUZhfGGNtYXAAABeQAAAA+gAAAgKUT7VmaGVhZAAAGIwAAAAuAAAANgxC6cFoaGVhAAAYvAAAAB4AAAAkBDAB/mhtdHgAABjcAAAAOgAAAEgGyAMAbWF4cAAAGRgAAAAGAAAABgAiUABuYW1lAAAZIAAAAOAAAAHjslP5wHBvc3QAABoAAAAAEAAAACAAAwABeJx9WXmQHFd5n1mrZ553ZXGpCQKzsh0s4xiwgASEjYuyuAopiUVhDmPLIGsPr7XaXe3O7uzs3NN3f6/vnnt3RtqVVpZlYxnj4AtMQeGQiFQqWITDmJiqGMfl/AGBpLeqlSLf61mtJVegu7rndb/3vve97/x9PfHYpk2xeDz+xtmJ1FhqfHjovSOTE6n3vj8W74vFY7eu3dS3dvNla2/bRDfHYfNlsHnTYH9s2+fe/AeAjcbmpAxrzTWfuzL+yzdcGYu98cq+q990ZWzble984M2xqxkZLjYQ2xq7OvYXsb+K7Y79TexLsaHYodiR2FxsIUZj3dijsW/Gnow9E/t+7B9iP4q9EHsl9vvYH+LJ+ED8TfFt8XfHP3zP5PjQWOrA+NjB2Ymh4enxsYnhmdT02KHh1L3Tk7Oj987M3jNzcHpsKjUzOzU83WveNzuTGhvJHByeSA1Prz+MzI6PrzfHh0cuDJkeG703NTmbGsKhYxPsfmR2MjV8cHJoeGxiZng6NTmNiw5PD42P4fjozexE791Fr+6dnB5bQNkdGJ+eHcfJU5mDs6mpAzOp4dkJZPgQu0Ymp7FnfHL63rHxsVSvOT18eHJuGHsOH1inNHb4wOj6ynNjQ8OTTCMTBw4jnSGcPzV8IMXezIwtDL9Oaa/XYSwWV+JqXIvrcYjTuBE341bcjjtxN/aZ2Ezci/vxarwWr8cb8Wa8FW/HF+NL8U68Gz8aPxZfjq/Ej8dPxK5hGuyLH+2jl/2B28f9KpFJvJK8LHko+XNyDZnqVwauHfjA5vdsrm3+4RWJK371hpfe+MSbf7j1jq0/52/kU/y5t37lz469DbaNv+PWLcHYT3nd0l3d033wwCVwEjrwODzBOYZPm1ADX3fBBezWfM3THNVVHdmVHckR7QrxitYCzMLe0UMfhyIUzJxDlOA+HkkswzIHPrT0DnT0Fvgts0F9aEBdr6k1tapUZV/yBLtMnLKBMyGrFeSSXBIrFakilZSiWtLyeg47SiAYJHxf6PJU5Rw4Rh8xHjFP0S5y29AXoa03sLUEi7Rtts2W1XJJy2l6tWqt6tedlts2F5Gbk5WVdGd+abox4VYtz3JM4piu7dme49iWY9mWa3qmZ1QZx2pDrst1sVrxSMUrO0WnaBetglk0CkYeFJCgQitUAhmm4V7Yr5H92n16Ric0xVEwdRssdoGt44l3Szc1Szd0qlmCcT2Et5FMUtdA0RVSYg1VxybeVV3T8BLVslrQ8pqAD2RL0HeGt2mdLtIlo0GrKL4unECyvl7TaqgyGwhjmTNqqCz/kJ0xVUp0mwOT2tSjnoFndK+aPnWAmm3vodoz9We8R+2ThBpgUQcH2jjcpBaeNrUM0zWrZtNq4N0xiFlFOq4MFT0PBb2oV6DMLtRKCYq0CHm6QEkWmxIQeYIzdQfQlsDR2WlrtkbEJIjyZPmO8h2lLxa/UPq8NKnrWlEpy6KolpS8mlNETce9fmvtdn4FmoolWjJNwyh5TxIOG7Nm1pr15mv5em6xtFw5VllVTqOJrphHna6z6LdqpImq9hq2Z9ZR+13jfv2M+pz2iGYRL4mqMIGCbVimSalrNA0PmDzYjvG9iepxiZxIafN6npJ9xgzoM5Z+P+VwmOqIlmJUaJHQBQ43mTPyNE9LtEwraOk5OKzNIvPMYsuqJEoVkQhSRS6pC3JGTcMCZK0Fv+hWPLEuNOWuvkyU5+GfOFzV0C3iJ2HZqBumZbtGHfCkNYNgT4danKQLKFsJpZ2CnJ5FUhJkYdpAmdMSkNKRBOoNhUzWbjm/gwcVtOjABjm/K4GPoBmaAQaYZCmJezTwoAY1gaztSuAj2qKBY0AlW9Yg8PnzFTYJdcIufJtJgkqRBF46m1RhkyiNqKzTRAKUXWzJ+BIf3JvAWGCX7LSfdQrWPfUj9UKj0JAa0IRFt1mvNWpL9lEgK9AV2plquZquThJLX0HyHBqghUzWtUVtRW2hUbuzbtYuGLNWlpbhyzBcnJ4hR2aKh2EMFqyMP28LeIokuHY33xGaoiO38l4OBVRQipVipVQScnJeymtomVA0ihYpWWWn4giu4Es15Bmlr1uqrbkqOx0yUUjoZUhzqNUcpIkSbZ7qpupqNZU8WuRaSkc7CivQMVpW02w5Lb/pVz3X9X23alfdrtWFowTQCzUX/fWJ4Ar+qv5gT54fTX0mQV3LxcPxnKrj23i5VcfDB7dqMq13pFahRgr1BXsO5iAj5YqiJEmySE4d4TAkmYbpu75VZWFZtRVHNiUQQVJFWZbZMJkIiiCj1UmCKEqChOZXlssa+iWBgiEEO4B7jaFAjjgCx3RsBw8bWbMw/tm+49mu49qOZ/m2b/hQIz3Genylka/sa3zVapyHETRKFaqj2Os8aRFPIvIkIksVifR4wnODJ4ycCpUJFYLrkK+1v1z7FH91f/Bk+A6+LIiVwbCQqAhudXs7icL1B4NCwvfE8nYvvI2vsgYA6hg4HFseDM8kyhtjq4NB/UU+C8le15cv7fpyIprN1vskf01/cG7H+v3P1+8XOAnfs6ks9ia6XrW3vlDenk1G3H07fB9fdS9iQ2RrPZLYmIJrPbPp4qfgzt4GeoxVBjd2fO7aHiWkHBF5/b7Dr/L+pRuuvH6l4Lu9DUfz77x0/p2JiPpry4XPsp+XXuTf1f+bTdf2h//zWZ4CpYNAzz7MUdY0dG3wVkgy/9d1oIN7H8Z1dewBSv44nd9dz2s6Nbb/GJIsOgwCG6+TfxzFyVSnOuiE0RsE/a9HOUYYAKnNnuH1BEZfDH0GphvAU7NVQzEVQ4lyq0wlqlDVIKKlNmCZBMeSsGq2XMswMFFhDsMUheHPoqZpYc5iBDDNWES1VEMGAe1sAWNmAWOoAAWK0ZMWsCWDqqkK0RRdxrZoyCwzOZinXMxSpuYqZg6mCOyECoeZGIeQ8K4ETsJgQDC//pq7mAf7Ih5M01jnQbWIZrFdXOChGPGA+REyyEOF2b+mMR40xoNsyJZmqhiMetPBAXyOAhRVCYYglYmBKoyHyHEwJ5SRXpijWQ5Sal5UVEZKlxE9MAShaCoeOpOhQlGeBIWq2eindWjTNmYY5rNNBExLCJh8YDowLGJuKCFSAYqQEZAYvDFUA3XQglUC/w0+h4gCYSAJPp9wcYKhE4RB4WWMlUKPFQlZkS+woikqPjBWZMaKamkWLlpHlLa4zgrDbot6Hd+iWexZu5tnWElBieAUFP87E5+Fg+qcmBLSuYXUwqwwCeMw5UzXZxuppYWVUqeyLJ3USHhNEjnFaabChEhOJZh20DQivZDgN98If4MjqGLhCAbMyAM4AjVn9ayHBC8koYpmhZjANG30BxthFurWRFToMHPDoH7l2i38jv7g0Ft39G8JPhBs4nupEIVgapSEmwIu2BRs4jbeohJJvslpUYZkCE9HRt8ebuN0TY8yL6pXIwF7Q5nO2STMryTYGzzHU1PvpWicTTIWF9HA5KzpmJuvOs8hERoRYKPIksyxLB0lZ8z5JHgq2MvTDUZ0RM5vD3BhA6dAjxDJ5zltgxEDGdkUspPjMACoG2+bec6IEACSQv9GMaSCFH82SO1Nhqlw64VWcI7HRphKhJv38vDyrA7H/66+BBBu5drv4nUdDWQ+M5Mjj1MYuwHgOPfoaquNONZX7QI6Skkry0R/kKvaLcTp5DFnLrN9y1m20Nm9yb3B1t5v6Ee/Z9lz4OOy/mst1sdaW4KtwTf4vYeC20/fcPbV0+Hth84mkTP+0NnTidOb2P2GvfzZQ3vZiFcP7U3gJr6BM8/hzLXM2g4+HEgUoagURPJKEnObK9uyLZoimuJAAh1ZqygVRVBkmYSXh5dzsowP+ErDLhLejhDXFHGC5GrMR3buSqy/kJESvjiJTuOaNh4mNtAsLyzhiAZbYuff8h/6UPL64IvsJ7j6Oh7TqahWlHJEf3e4A02jP+m9RsMjQX/QF/Yngz3hOR7lsScYSHhRdrfxxvoHgjgKZRURHnol+qOKt17gYU5maZHfG8wRDGwQjAEW8xLsB/KrDB9cG3AcghCG4xF+SCYZWUKTVmH9RJO+I7xsvIMGyqI91he+7ustqVlpVhqFerY63T7iTcIRmBOyOSIgQlbKCqqbFo28nffz1UK92C4fz54QTkIbmmbDwTBhoDuQh+bG5jg1ArUFO29mAakI09lsuVgq5yt5OY/lUcpLL2ZJO3dUPIHVwAnveLtdbdQQmjWcJm0xVtQqy2AGJQ90AmQUKxM80StM9A5yZolzmLu7FLcmWyT8j2AfL4olNQ/zkLEz9ZxfrskNuWFUfcR6NbOJNWRHXiySdqVatIp2QStXBDITjvELpXlpHsFmyRIR7WtVu243qrVWdam25HQQANcUVyS+YJRlNK5yKVsm3w4+zptYf2C5iEkzSsHMY1mLuN5yXtE4SVEwTRE1eeZOfv+U6GI61iPEzdIyEzemZtV44iScDiaDN5zJhKPhR7hgd9jHhze9whkRTfKtrwfXhwQx4OQZPngBrWUgCYIp2RKzSg+tsj/ckwj3rN3IY1xQezEGEX24P4GxIaoAmPdHgJ+hf4MFGJy1n9UDEMUnVi6cC0d4ePHFD3E/wF9P85Sq4ito2ugnweWcarLkvuFSuLgp4BJnEyKIKhq5rGKDnN/KOLvIX3bu/9MOtCV4V3B9L84ZYF4IlxvB9tbdvVCrsn1giGWxMopjLMhe8QMe1hMtmxIFRb03nOzswf+ogGLGYsBG3bM3uPGSeeRGJiY2r7eSGkXkaCXy8oWSiUZTg/8d5eGY0Mkukhte5RRLxhKXyJ/+2Uc5R0b3FzG6IL4mB+7BsCKpDDVIqCZyy88+LXOsGrYU8uoNXCvbFZZhGTpeu00ee4xrt7wuAqTwE8E9vOIqtmIx6rl22ktBCubFbJYcOMBls8I8Ps566XaWUbFwoKsQ+59v+TknIQZiQN5wHZtRtG2XhRZwVEcmyF1gzK9vuads3PJ6pbgh3I0y8WWsSg3aqzXRaMKdwc5ork57mrmkxLwxefHcXvbrKZMElz/9Or1GFW1U5pLdF+lVZf5gRnqNkueWtU8FH+EvFqWItrUuys8+yzbL9uaZuFl0D8RexJE4xp/ZI6T3MjELohhDbYN99TIZE2RdBsyMKJEc2eawgDI9JjrNlsiz+9b1iK4T7EcWVCyXmLuqJo6O4qPK9hGZDbuQKZWVcJqEzegVieShEkwIEocuo4GO24hMQTTRl/b9/Z9W1vdvYywgORL44X5mbN1sm+x7lsuum0NayC6Q6ePc4iIzGlhGY4z6/4i5pLx5NJdnb+Pa60bX9dHojk9zC1khHfWn2znW/0eMcsva7iDO+45YEbAExFomGf4WEoLketvBdxwPUXXwW3z5na/xouS4221I/i5oc9S2LQfIEwzEIRYlAP8VtiCKd6BwKFVxUIcJSCCeMxHzA8w/FW6Dhbs4DfOxBOQ/A4H/Yjj4O1b4fiG4nA+2weLd4UeBO/0S/0ww+Ew4yL0cPMB329n09vDpZDqbTQ9qcFWwzAoezANI4u4EQl/E1eSqcLkMXDrb7m4Pnk522+0u1nBW8Hl+avWmm29+fmrq+Ztvvml16vlf/OKm1dWbfsEdWxvkw3+FwmhwDSBE+MkjEFwe/AQfuPO7zw/ywTFoPBweY6XvXWvX8df1h2/5F/7dLIe/wF/fPxLu4nf+OuwL+0bP3H473B48DlxYDnbwLWg41WqtZjegBW25XqqVawU7+t4hl0ulklyELIGcXaiVquWG1GZg+v+hH+4d5cO+BBYQiigKAhpWmYR9SSibgie6gqdWMcb2JaroHh7mO8uDKj4jMlY80RNcwSpj/9U6r0XK6Pky+djH4MhPPobFXhQArAQWFCZYJNiVRCyBuRyj9Gzwe74zvPjVxTtJFvajOLESQiGHH8Sy/igs0ZZJo7hsMR+GGrT1Ze2Y1tZrwF5hOGgndawhRCpiTcIqIpmimWOdoprojiYiGMtuV08Q/4TXsWsk2Ip4E6yyl/Hm3QUn5+TMMnLLqk+N3XsVrh5Vpr2wD9GpRztiFeqwwIGoY9zwsFQ5QVdpl7awbFnSV/QVbQlbeGBUJxb7tmgjMKKCUTALZsVkmU61FV+qiW3hqHBUbqoOEZZKq/mH8g+VV6QW2Re8k1uvDkbh5vCeT4ef4DSMBAo7NBlPhVVzutQ78QmVOYn4DU7JJ4urxdUc+4bdnWlN1afqk/ZhxEVT8pHykdJMLj1PRs5wkoOCUgVFlRko3dqre9jJ6p5gK+JD27QwAOqu5JChr3ONRstfdBfdJbMDXegoS+KS0Co38s1CNedl3Iw1D2kCaWVezAiZci5fKORzZWyK8woLAnN2upr2M81Ch0TR60J9MTTE6gv9QvY9On08fSp/f/4B6UE4BSft1fpqfaXV6ZJup7WC7VX7JJxiO13DAsJTbcFCkILhj4yMcOnOTOtI7Uh1yp4E3K88VZwqzuTm0+n53Aw2p2R8TeCwPYkSmWrNdOc76ZUcSqp4Uj4FD8IDzv3NU83j3aPHyUZOQU7Z3jeyErJamM/k05V0eU7GQAnzFm7dy1ULTZJvlFsCSkVh8ulaHXfJW6q2mo1GE/Gdt+R2rC6QR+Chwskj5OAQh1EfQYsl2BG62hoVmhYeUaG5ZU0O+vhU8PgyQhnLYB/asd61yeiTHKZkg/2fgAYgk9G7OAWtAP0HMToGw+Xw8RTGJPbtQEMPsGTy8F2cxT5gsE8GhmWTh5/kLJuyrweWwqqJ85NrcX5GgTDOYVWseDLzEqtqVs2aWTNqlmualuFhs254mOUI4u8I7KEnsCy/nl5BI4hMZLiPQ0g8QYdgmE5ga482gpWPJqhlrayWVUGtqBIaHNGSOF2mlSo0aYd2jSaW0XXo6qvaqnZUb1JSTbB/GZhTo994olkys1bWKlqCpbsa+9PABZ9WCdQoS7un9G/C9+B7+hlYwvK8YbQchtWBXRaQYwlfd1iDaXXQTjBQzLTLQhExVYwBGCokirUVXgJVQHOydtGuIOA3XIM6yFubwGNwWj9G2GenIoZ/NQoO64UxM18iYajaBZwIZco+/ZdRHGQksaCzD0rDaCga+zzmbwUenlu7DhKD/fEPf2Xz5a3N/VfGtr0l1s/+oftSLBWzYw/GzsZejX8wLsab8UfHYd+/feenDwM8dSsc3CMWOfbPDwtJiV5sUFzNQpgx9MOPAtz5dfjOLZ/bNYKtH8M3n+PYRzP20cahwPUQFHGLj3/8R8ANXPJN8dwlnwuxT6hEfcJ6n8f6fPadk/WxeZXX+vwL30AHsn/yE+NAFtansf7eNM9b70eiA3OwIOTwEDMwB3NuppVr5RaFo5jIapJdrM4pM/OHyczIeGYYyGiyjpqvmU/XH/na6vdXv+t+u/BU4Vvjx+8AMvCBlzgZo0IFT8Fg1YOfWEdQshZVD3dj+W2IDiunmeetbU1cDOJI8EusPnQfyxJfZoXJgKNZTHT//n4OIR3DGWEsMXC+b21PMBX2J0C4iBZW1QP/BxAWN4cAAHicY2BgYGQAgjO2i86D6KuTQpJgNABK3wa2AAB4nGNgZGBg4ANiCQYQYGJgBEJFIGYB8xgABbUAVAAAAHicY2BmYmCcwMDKwMHow5jGwMDgDqW/MkgytDAwMDGwcjLAADMDEghIc01hcGBQYtjE+OD/AwY9JogwI4gAmrmDQQEIGQHWvApYAAB4nJ2Qy0pCURSGv6NyzMxL3jKtPEqECQbNQ2yUc6diRJA4CKKBBD1JT9CkgTQSfIV8AUe+QG8QrNbZbs1BlPjDWvvfa//rshcQZG4HOPj40ptj7iFmetbwlG0rq3DKGedc0OCSFh2uueWOPvc8MOCZV95FTJUKVepW2+RKtV1ultpHnhZa+VSbykwm8uEnytj4kbzIUN4M70nbznbCAp528Lscr0Sqlu0QJU+BMjFc0uxrdoaU/qKof8uRVW2JJDgutvBfSMyLRtWFt2D35yWia8kXDC3Hfsncw9XuTgaOIKCBQ3+tqVAxqEN4peS/rS3i6wo3wDfEtCzZAAB4nGNgZGBgAOK4WQv/x/PbfGXgZmIAgauTQpJg9P/fDAxMrGBxDgYwBQBCJQqOAAB4nGNgZGBgYgACPSaG/7///2ZiZWBkQAVMAF8lBDIAAHicY2JgYGBiYDBnyGNQBTLVgNAfCQoyBDDY/v/N4ACECQwQIMQgzuDM4MHACtShCuQByf//ASkyCcoAAAAAUAAAIgAAeJyVj02KwkAQRl9rDAwjiJvZjfReOqSzCQi6mxwhJzCRgCQQ41XceSCP4hHcTbVTLnQxYEPRr77+6qeBKScM4RhmWOURMRvlMUvOypF4rsoTPs1cOWZm1uI00Ycoi3tV4JH0T5XHlPwoR+K5KE/44qYcszDfHGkZaCT2VGxx1HR3zeHh2A7NsK+2ru7awYnw9PoQCxXD3bOTRpaMRNaxrCT+H/Ln8eSShcikLmQU0r7o+l1lsyS1K/uyjCg+d7nLUi/mdz9SiqvnIBXBFeaHfSmr/tB0rfVJ+nbPX1DNTYt4nGNgZkAGjAxoAAAAjgAF") format("woff");
      font-weight: normal;
      font-style: normal;
    }

    #odh-popup [data-icon]:before {
      font-family: "spell-icons" !important;
      content: attr(data-icon);
      font-style: normal !important;
      font-weight: normal !important;
      font-variant: normal !important;
      text-transform: none !important;
      speak: none;
      line-height: 1;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    #odh-popup [class^="icon-"]:before,
    #odh-popup [class*=" icon-"]:before {
      font-family: "spell-icons" !important;
      font-style: normal !important;
      font-weight: normal !important;
      font-variant: normal !important;
      text-transform: none !important;
      speak: none;
      line-height: 1;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    #odh-popup .icon-bold:before { content: "\\62"; }
    #odh-popup .icon-italic:before { content: "\\69"; }
    #odh-popup .icon-underline:before { content: "\\75"; }
    #odh-popup .icon-strikethrough:before { content: "\\73"; }
    #odh-popup .icon-subscript:before { content: "\\b2"; }
    #odh-popup .icon-superscript:before { content: "\\5e"; }
    #odh-popup .icon-justifycenter:before { content: "\\2d"; }
    #odh-popup .icon-justifyfull:before { content: "\\2e"; }
    #odh-popup .icon-justifyleft:before { content: "\\3c"; }
    #odh-popup .icon-justifyright:before { content: "\\3e"; }
    #odh-popup .icon-outdent:before { content: "\\29"; }
    #odh-popup .icon-indent:before { content: "\\28"; }
    #odh-popup [class*="icon-heading"]:before { content: "\\48"; }
    #odh-popup .icon-paragraph:before { content: "\\a7"; }
    #odh-popup .icon-quote:before { content: "\\22"; }
    #odh-popup .icon-code:before { content: "\\7b"; }
    #odh-popup .icon-insertorderedlist:before { content: "\\31"; }
    #odh-popup .icon-insertunorderedlist:before { content: "\\72"; }
    #odh-popup .icon-inserthorizontalrule:before { content: "\\5f"; }
    #odh-popup .icon-copy:before { content: "\\63"; }
    #odh-popup .icon-cut:before { content: "\\78"; }
    #odh-popup .icon-paste:before { content: "\\76"; }
    #odh-popup .icon-unlink:before { content: "\\5c"; }
    #odh-popup .icon-link:before { content: "\\40"; }
    #odh-popup .icon-forecolor:before { content: "\\61"; }
    #odh-popup .icon-hilitecolor:before { content: "\\41"; }
    #odh-popup .icon-removeformat:before { content: "\\74"; }
    #odh-popup .icon-image:before { content: "\\70"; }
    #odh-popup .icon-video:before { content: "\\6d"; }
    #odh-popup .icon-fontname:before { content: "\\66"; }
    #odh-popup .icon-undo:before { content: "\\7a"; }
    #odh-popup .icon-redo:before { content: "\\79"; }
    #odh-popup .icon-fontsize:before { content: "\\47"; }
  `;

  (doc.head || doc.documentElement).appendChild(style);
}

// import { SVGIcon } from "../utils/config";
// import { addTranslateAnnotationTask } from "../utils/task";

export function registerReaderInitializer() {
  Zotero.Reader.registerEventListener(
    "renderTextSelectionPopup",
    (event) => {
      ensureReaderStylesheet(event.doc);

      const enabled = getPref("enabled");
      if (!enabled) {
        return;
      }

      const { reader, doc, params, append } = event;
      const expression = params.annotation.text.trim();
      const nrofWords = expression.split(" ").length;
      if (nrofWords > 1 && getPref("singlewordmode")) {
        return;
      }

      const popup = doc.createElement("div");
      popup.id = "odh-popup";
      popup.className = "label-popup";
      popup.addEventListener("mousedown", (e: Event) => e.stopPropagation());
      popup.addEventListener("scroll", (e: Event) => e.stopPropagation());
      popup.addEventListener("keydown", (e: KeyboardEvent) =>
        e.stopPropagation(),
      );

      // popup.append("Loading…");
      append(popup);

      const ele = doc.querySelector(".selection-popup") as HTMLDivElement;
      ele.style.maxWidth = "none";

      addon
        .api_getTranslation(expression)
        .then((result: any) => {
          const translation = new Translation(optionsLoad());
          translation._document = reader._iframe!.contentDocument;
          // translation._window = reader._iframe;
          addon.data.currentTranslation = translation;
          addon.data.currentTranslation.notes = result;
          // const expression = params.annotation.text.trim();
          const notes = addon.data.currentTranslation.buildNote(
            reader._iframeWindow![0],
            expression,
            result,
          );
          return addon.data.currentTranslation.renderPopup(notes);
        })
        .then((content: any) => {
          popup.innerHTML = content;
          // Styles are injected as inline <style> (chrome:// blocked by CSP)
          popup.style.visibility = "visible";
          onDomContentLoaded(doc);
        });
    },
    config.addonID,
  );
}

export class Translation {
  options?: Option;
  notes: any;
  sentence: null;
  maxContext: number;
  [key: string]: any;
  // _window?: Window;
  _document?: Document;

  constructor(options: Option) {
    this.options = options;
    this.notes = null;
    this.sentence = null;
    this.maxContext = 1; //max context sentence #
  }

  async api_addNote(params: {
    nindex: any;
    dindex: any;
    context: any;
    extrainfo: any;
  }) {
    const { nindex, dindex, context, extrainfo } = params;

    const notedef = Object.assign({}, this.notes[nindex]);
    notedef.definition =
      this.notes[nindex].css + this.notes[nindex].definitions[dindex];
    notedef.definitions =
      this.notes[nindex].css + this.notes[nindex].definitions.join("<hr/>");
    notedef.sentence = context;
    notedef.url = window.location.href;
    notedef.extrainfo = extrainfo;
    const response = await addon.api_addNote(notedef);

    if (this._document == null) return;
    api_setActionState(this._document, { response, params });
  }

  buildNote(_window: Window, expression: string, result: ConcatArray<never>) {
    //get 1 sentence around the expression.
    // const expression = selectedText(_window!);
    const sentence = getSentence(_window, expression, this.maxContext);
    this.sentence = sentence;
    const tmpl: { [key: string]: any } = {
      css: "",
      expression,
      reading: "",
      extrainfo: "",
      definitions: "",
      sentence,
      url: "",
      audios: [],
    };

    type Tmpl = {
      [K: string]: string;
    };

    //if 'result' is array with notes.
    if (Array.isArray(result)) {
      for (const item of result) {
        for (const key in tmpl) {
          item[key] = item[key] ? item[key] : tmpl[key];
        }
      }
      return result;
    } else {
      // if 'result' is simple string, then return standard template.
      tmpl["definitions"] = [].concat(result);
      return [tmpl];
    }
  }

  async renderPopup(notes: any[]) {
    let content = "";
    const services = this.options ? this.options.services : "none";
    // const services = "ankiconnect";
    let image = "";
    let imageclass = "";
    // TODO: make options sanity
    if (services != "none") {
      image = services == "ankiconnect" ? "plus.png" : "cloud.png";
      imageclass = (await isConnected())
        ? 'class="odh-addnote odh-addnote-plus"'
        : 'class="odh-addnote-disabled odh-addnote-plus"';
    }

    for (const [nindex, note] of notes.entries()) {
      content += note.css + '<div class="odh-note">';
      let audiosegment = "";
      if (note.audios) {
        for (const [dindex, audio] of note.audios.entries()) {
          if (audio)
            // audiosegment += `<img class="odh-playaudio" data-nindex="${nindex}" data-dindex="${dindex}" src="${
            //   rootURI + "fg/img/play.png"
            // }"/>`;
            audiosegment += `<div class="odh-playaudio" data-nindex="${nindex}" data-dindex="${dindex}"></div>`;
        }
      }
      content += `
                  <div class="odh-headsection">
                      <span class="odh-audios">${audiosegment}</span>
                      <span class="odh-expression">${note.expression}</span>
                      <span class="odh-reading">${note.reading}</span>
                      <span class="odh-extra">${note.extrainfo}</span>
                  </div>`;
      for (const [dindex, definition] of note.definitions.entries()) {
        const button =
          services == "none" || services == ""
            ? ""
            : `<div ${imageclass} data-nindex="${nindex}" data-dindex="${dindex}"></div>`;
        content += `<div class="odh-definition">${button}${definition}</div>`;
      }
      content += "</div>";
    }
    // content += `<textarea id="odh-context" class="odh-sentence">${this.sentence}</textarea>`;
    content += `<div id="odh-container" class="odh-sentence"></div>`;
    // content += `<div id="odh-container" class="odh-sentence">${this.sentence}</div>`;
    // return this.popupHeader() + content + this.popupFooter();
    return `<div class="odh-notes">` + content + this.popupIcons();
    // return `<div class="odh-notes">` + content;
  }
  popupIcons() {
    const root = rootURI;
    const services = this.options ? this.options.services : "";
    const image = services == "ankiconnect" ? "plus.png" : "cloud.png";
    // const button = chrome.runtime.getURL("fg/img/" + image);
    const button = "chrome://zodh/content/fg/img/" + image;
    const monolingual = this.options
      ? this.options.monolingual == "1"
        ? 1
        : 0
      : 0;

    return `
              <div class="icons hidden" style="display: none;">
                  <div id="context">${this.sentence}</div>
                  <div id="monolingual">${monolingual}</div>
              </div>
            `;
  }

  popupHeader() {
    // const root = chrome.runtime.getURL("/");
    const root = rootURI;
    return `
          <html lang="en">
              <head><meta charset="UTF-8"><title></title>
                  <link rel="stylesheet" href="${root + "fg/css/spell.css"}">
              </head>
              <body style="margin:0px;">
              <div class="odh-notes">`;
  }
}
