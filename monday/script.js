(() => {
    const timeZone = "Europe/Berlin";
    const celebrationDuration = 12000;
    const elements = {
        days: document.querySelector("#days"),
        hours: document.querySelector("#hours"),
        minutes: document.querySelector("#minutes"),
        seconds: document.querySelector("#seconds"),
        status: document.querySelector("#status-text")
    };

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    });

    function getZonedParts(date) {
        return Object.fromEntries(
            dateFormatter.formatToParts(date)
                .filter((part) => part.type !== "literal")
                .map((part) => [part.type, Number(part.value)])
        );
    }

    function getTimeZoneOffset(date) {
        const parts = getZonedParts(date);
        const asUtc = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second
        );

        return asUtc - date.getTime();
    }

    function berlinTimeToUtc(year, month, day, hour) {
        const approximate = new Date(Date.UTC(year, month - 1, day, hour));
        const firstPass = new Date(approximate.getTime() - getTimeZoneOffset(approximate));

        return new Date(approximate.getTime() - getTimeZoneOffset(firstPass));
    }

    function berlinWeekday(date) {
        return new Intl.DateTimeFormat("en-US", {
            timeZone,
            weekday: "short"
        }).format(date);
    }

    function nextMondayAtEight(now) {
        const parts = getZonedParts(now);
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDay = weekdays.indexOf(berlinWeekday(now));
        let daysAhead = (8 - currentDay) % 7;
        const isBeforeEight = parts.hour < 8;

        if (currentDay === 1 && isBeforeEight) {
            daysAhead = 0;
        } else if (currentDay === 1) {
            daysAhead = 7;
        }

        const localDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + daysAhead));

        return berlinTimeToUtc(
            localDate.getUTCFullYear(),
            localDate.getUTCMonth() + 1,
            localDate.getUTCDate(),
            8
        );
    }

    function isCelebrationWindow(now) {
        const parts = getZonedParts(now);

        return berlinWeekday(now) === "Mon"
            && parts.hour === 8
            && parts.minute === 0
            && parts.second < 12;
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function renderCountdown(distance) {
        const totalSeconds = Math.max(0, Math.floor(distance / 1000));
        elements.days.textContent = pad(Math.floor(totalSeconds / 86400));
        elements.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
        elements.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
        elements.seconds.textContent = pad(totalSeconds % 60);
    }

    const canvas = document.querySelector("#fireworks");
    const context = canvas.getContext("2d");
    const particles = [];
    const colors = ["#10b981", "#7dd3fc", "#fbbf24", "#f472b6", "#f8fafc"];
    let animationFrame;

    function resizeCanvas() {
        const scale = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * scale;
        canvas.height = window.innerHeight * scale;
        context.setTransform(scale, 0, 0, scale, 0, 0);
    }

    function burst(x, y) {
        for (let index = 0; index < 70; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;

            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.045,
                alpha: 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 2
            });
        }
    }

    function animateFireworks() {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);

        particles.forEach((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            particle.alpha -= 0.012;

            context.globalAlpha = Math.max(0, particle.alpha);
            context.fillStyle = particle.color;
            context.fillRect(particle.x, particle.y, particle.size, particle.size);
        });

        for (let index = particles.length - 1; index >= 0; index -= 1) {
            if (particles[index].alpha <= 0) {
                particles.splice(index, 1);
            }
        }

        context.globalAlpha = 1;
        animationFrame = requestAnimationFrame(animateFireworks);
    }

    function celebrate() {
        if (document.body.classList.contains("celebrating")) {
            return;
        }

        document.body.classList.add("celebrating");
        elements.status.textContent = "MONDAY HAS ARRIVED. Please look productive.";
        resizeCanvas();
        animateFireworks();

        const burstTimer = setInterval(() => {
            burst(
                window.innerWidth * (0.15 + Math.random() * 0.7),
                window.innerHeight * (0.12 + Math.random() * 0.45)
            );
        }, 420);

        burst(window.innerWidth * 0.5, window.innerHeight * 0.3);

        setTimeout(() => {
            clearInterval(burstTimer);
            cancelAnimationFrame(animationFrame);
            particles.length = 0;
            context.clearRect(0, 0, window.innerWidth, window.innerHeight);
            document.body.classList.remove("celebrating");
            elements.status.textContent = "Next launch: Monday, 08:00 · Europe/Berlin";
        }, celebrationDuration);
    }

    function update() {
        const now = new Date();

        if (isCelebrationWindow(now)) {
            renderCountdown(0);
            celebrate();
            return;
        }

        renderCountdown(nextMondayAtEight(now) - now);
    }

    window.addEventListener("resize", resizeCanvas);
    update();
    setInterval(update, 1000);
})();
