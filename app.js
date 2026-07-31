(() => {
  const data = window.HUPAN_DATA;
  const form = document.querySelector("#lookup-form");
  const input = document.querySelector("#name-input");
  const status = document.querySelector("#lookup-status");
  const result = document.querySelector("#group-result");
  const memberList = document.querySelector("#member-list");
  const scheduleList = document.querySelector("#schedule-list");
  const generateButton = document.querySelector("#generate-poster");
  const posterModal = document.querySelector("#poster-modal");
  const posterImage = document.querySelector("#generated-poster");
  const downloadPoster = document.querySelector("#download-poster");
  const closePoster = document.querySelector("#close-poster");
  const presetName = new URLSearchParams(window.location.search).get("name");
  const autoGenerate = new URLSearchParams(window.location.search).get("generate") === "1";
  let activeProfile = null;

  const normalize = (value) => value.trim().replace(/[\s·•.。，,（）()]/g, "");
  const searchIndex = new Map();

  Object.entries(data.groups).forEach(([groupNumber, members]) => {
    members.forEach((displayName) => {
      const variants = [displayName];
      const aliasMatch = displayName.match(/^(.+?)（(.+?)）$/);
      if (aliasMatch) variants.push(aliasMatch[1], aliasMatch[2]);
      variants.forEach((name) => searchIndex.set(normalize(name), { groupNumber, displayName }));
    });
  });

  function arrivalFor(groupNumber) {
    const group = Number(groupNumber);
    if (group <= 9) {
      return `第${group}组：8月1日7:40集合、8:00参观；8月2日不参观，8:30到会场。`;
    }
    return `第${group}组：8月1日不参观，8:30到会场；8月2日7:40集合、8:00参观。`;
  }

  function showResult(match, typedName) {
    const members = data.groups[match.groupNumber];
    activeProfile = { ...match, typedName, members };
    document.querySelector("#result-name").textContent = match.displayName;
    document.querySelector("#result-group").textContent = match.groupNumber;
    document.querySelector("#group-seal").textContent = `${match.groupNumber}组`;
    document.querySelector("#personal-arrival").innerHTML = `<strong>你的到场安排</strong><p>${arrivalFor(match.groupNumber)}</p><span>如果之前已经参观过，可不参加参观，当天8:30到场。</span>`;

    const normalizedTyped = normalize(typedName);
    memberList.replaceChildren(
      ...members.map((member) => {
        const item = document.createElement("span");
        item.textContent = member;
        const aliasMatch = member.match(/^(.+?)（(.+?)）$/);
        const variants = aliasMatch ? [member, aliasMatch[1], aliasMatch[2]] : [member];
        if (variants.some((variant) => normalize(variant) === normalizedTyped)) {
          item.classList.add("is-current");
        }
        return item;
      }),
    );

    status.textContent = "";
    result.hidden = false;
    if (!presetName) result.scrollIntoView({ block: "start" });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const typedName = input.value;
    const query = normalize(typedName);
    if (!query) {
      result.hidden = true;
      status.textContent = "请先输入报名姓名";
      input.focus();
      return;
    }
    const match = searchIndex.get(query);
    if (!match) {
      result.hidden = true;
      status.textContent = "没有找到这个姓名，请核对报名姓名或联系工作人员";
      return;
    }
    showResult(match, typedName);
  });

  function renderSchedule(day) {
    scheduleList.replaceChildren(
      ...data.schedule[day].map(([time, title, note]) => {
        const row = document.createElement("div");
        row.className = "schedule-row";
        row.innerHTML = `<time>${time}</time><strong>${title}</strong><span>${note}</span>`;
        return row;
      }),
    );
  }

  document.querySelectorAll("[data-day]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-day]").forEach((candidate) => {
        candidate.setAttribute("aria-selected", String(candidate === button));
      });
      renderSchedule(button.dataset.day);
    });
  });

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 5) {
    const chars = [...text];
    const lines = [];
    let line = "";
    for (const char of chars) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
    return y + Math.min(lines.length, maxLines) * lineHeight;
  }

  function fillBox(ctx, x, y, width, height, color, accent) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    if (accent) {
      ctx.fillStyle = accent;
      ctx.fillRect(x, y, 10, height);
    }
  }

  function createReminderPoster(profile) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 2200;
    const ctx = canvas.getContext("2d");
    const group = Number(profile.groupNumber);
    const visitDay = group <= 9 ? "8月1日" : "8月2日";
    const normalDay = group <= 9 ? "8月2日" : "8月1日";

    ctx.textBaseline = "top";
    ctx.fillStyle = "#f7f5ef";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#071553";
    ctx.fillRect(0, 0, 1080, 355);
    ctx.fillStyle = "#ffffff";
    ctx.font = '900 92px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("业绩倍增", 72, 78);
    ctx.font = '700 32px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("私域零售第一课 · 第四期", 76, 205);
    ctx.fillStyle = "#9fd9d1";
    ctx.font = '600 25px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("湖畔实战营｜个人课程提醒", 76, 265);

    ctx.fillStyle = "#0b3d3b";
    ctx.fillRect(0, 355, 1080, 290);
    ctx.fillStyle = "#9fd9d1";
    ctx.font = '700 25px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("你的课程身份", 72, 410);
    ctx.fillStyle = "#ffffff";
    ctx.font = '900 62px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`${profile.displayName}｜第${group}组`, 72, 458);
    ctx.font = '600 24px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = "#c6dcda";
    ctx.fillText("主讲：肖尚略老师　地点：湖畔创研中心“无知”小礼堂", 74, 558);

    ctx.fillStyle = "#16857f";
    ctx.font = '800 26px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("你的到场安排", 72, 710);
    fillBox(ctx, 72, 760, 936, 270, "#ffffff", "#d84a3e");
    ctx.fillStyle = "#d84a3e";
    ctx.font = '900 37px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`${visitDay} 7:40集合`, 110, 805);
    ctx.fillStyle = "#162526";
    ctx.font = '700 30px "PingFang SC", "Microsoft YaHei", sans-serif';
    drawWrappedText(ctx, `${visitDay} 8:00开始参观湖畔；${normalDay}不参观，8:30到会场。`, 110, 872, 840, 48, 3);
    ctx.fillStyle = "#607071";
    ctx.font = '500 23px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("之前已经参观过的学员，可不参加参观，当天8:30到场。", 110, 975);

    ctx.fillStyle = "#16857f";
    ctx.font = '800 26px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`第${group}组成员`, 72, 1090);
    const columns = 5;
    const chipWidth = 174;
    const chipHeight = 76;
    const gap = 16;
    profile.members.forEach((member, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = 72 + column * (chipWidth + gap);
      const y = 1140 + row * (chipHeight + gap);
      const current = member === profile.displayName;
      ctx.fillStyle = current ? "#d84a3e" : "#e8f1ee";
      ctx.fillRect(x, y, chipWidth, chipHeight);
      ctx.fillStyle = current ? "#ffffff" : "#162526";
      ctx.font = `800 ${member.length > 6 ? 22 : 27}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(member, x + chipWidth / 2, y + 21);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = "#16857f";
    ctx.font = '800 26px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("课程重点", 72, 1445);
    const reminders = [
      ["签到", "7月31日 13:00-21:00\n前台大堂，必须带身份证"],
      ["补签", "8月1日 7:30-8:30\n未提前签到可开课前补签"],
      ["随身物品", "电脑 + 外套\n每组至少1台电脑，室内较冷"],
      ["吃住安排", "公司统一安排三餐\n住宿和往返杭州交通自理"],
    ];
    reminders.forEach(([title, copy], index) => {
      const x = 72 + (index % 2) * 476;
      const y = 1495 + Math.floor(index / 2) * 220;
      fillBox(ctx, x, y, 460, 198, index < 2 ? "#fae4df" : "#e8f1ee", index < 2 ? "#d84a3e" : "#16857f");
      ctx.fillStyle = index < 2 ? "#d84a3e" : "#0b3d3b";
      ctx.font = '900 29px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(title, x + 32, y + 27);
      ctx.fillStyle = "#162526";
      ctx.font = '600 23px "PingFang SC", "Microsoft YaHei", sans-serif';
      copy.split("\n").forEach((line, lineIndex) => ctx.fillText(line, x + 32, y + 80 + lineIndex * 41));
    });

    ctx.fillStyle = "#814037";
    ctx.fillRect(0, 1960, 1080, 240);
    ctx.fillStyle = "#ffffff";
    ctx.font = '900 31px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("地址：浙江省杭州市余杭区礼贤路9号", 72, 2010);
    ctx.fillStyle = "#f6ded8";
    ctx.font = '600 23px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("课程时间存在不同通知口径，请按分组要求提前到场", 72, 2070);
    ctx.fillText("第一天预留至22:30，第二天预留至17:00，以现场通知为准", 72, 2110);

    return canvas.toDataURL("image/png");
  }

  function openReminderPoster() {
    if (!activeProfile) return;
    generateButton.disabled = true;
    generateButton.querySelector("span").textContent = "正在生成…";
    window.setTimeout(() => {
      const dataUrl = createReminderPoster(activeProfile);
      posterImage.src = dataUrl;
      downloadPoster.href = dataUrl;
      downloadPoster.download = `${activeProfile.displayName}-湖畔课程提醒.png`;
      posterModal.hidden = false;
      document.body.classList.add("modal-open");
      generateButton.disabled = false;
      generateButton.querySelector("span").textContent = "生成我的提醒图";
      closePoster.focus();
    }, 20);
  }

  function closeReminderPoster() {
    posterModal.hidden = true;
    document.body.classList.remove("modal-open");
    generateButton.focus();
  }

  generateButton.addEventListener("click", openReminderPoster);
  closePoster.addEventListener("click", closeReminderPoster);
  posterModal.addEventListener("click", (event) => {
    if (event.target === posterModal) closeReminderPoster();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !posterModal.hidden) closeReminderPoster();
  });

  renderSchedule("day1");

  if (presetName) {
    input.value = presetName;
    form.requestSubmit();
    if (autoGenerate) window.setTimeout(openReminderPoster, 50);
  }
})();
