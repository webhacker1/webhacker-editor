export function createElement(tagName, className, attributes) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (attributes)
    Object.keys(attributes).forEach((key) =>
      element.setAttribute(key, attributes[key])
    );
  return element;
}

export function executeCommand(commandName, commandValue = null) {
  document.execCommand(commandName, false, commandValue);
}

export function wrapCurrentBlockAs(tag) {
  executeCommand("formatBlock", tag.toUpperCase());
}

export function insertTable(rowCount = 2, columnCount = 2) {
  let html = "<table><thead><tr>";
  for (let c = 0; c < columnCount; c++) html += "<th>Заголовок</th>";
  html += "</tr></thead><tbody>";
  for (let r = 0; r < rowCount; r++) {
    html += "<tr>";
    for (let c = 0; c < columnCount; c++) html += "<td>Ячейка</td>";
    html += "</tr>";
  }
  html += "</tbody></table>";
  executeCommand("insertHTML", html);
}
