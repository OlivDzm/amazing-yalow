import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);
import React, { useState, useEffect, useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";

const activityMultipliers = {
  sedentary: 1.2,
  lightly: 1.375,
  moderately: 1.55,
  very: 1.725,
  extra: 1.9,
};

const moods = ["Great", "Good", "Okay", "Bad", "Terrible"];

export default function BodyResetApp() {
  // --- Basic Inputs ---
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(localStorage.getItem("age") || "");
  const [gender, setGender] = useState(
    localStorage.getItem("gender") || "male"
  );
  const [weight, setWeight] = useState(localStorage.getItem("weight") || "");
  const [height, setHeight] = useState(localStorage.getItem("height") || "");
  const [activityLevel, setActivityLevel] = useState(
    localStorage.getItem("activityLevel") || "lightly"
  );
  const [goal, setGoal] = useState(localStorage.getItem("goal") || "maintain");

  const [eatStart, setEatStart] = useState(
    localStorage.getItem("eatStart") || "13:00"
  );
  const [eatEnd, setEatEnd] = useState(
    localStorage.getItem("eatEnd") || "21:00"
  );

  const [bodyFat, setBodyFat] = useState(localStorage.getItem("bodyFat") || "");

  const [journalEntries, setJournalEntries] = useState(() => {
    const saved = localStorage.getItem("journalEntries");
    return saved ? JSON.parse(saved) : [];
  });

  const [journalDate, setJournalDate] = useState("");
  const [journalWeight, setJournalWeight] = useState("");
  const [journalMood, setJournalMood] = useState(moods[0]);
  const [journalEnergy, setJournalEnergy] = useState(5);

  const [calories, setCalories] = useState(null);
  const [fastTime, setFastTime] = useState(0);
  const [timeToReset, setTimeToReset] = useState(0);
  const [fastHours, setFastHours] = useState(15);

  useEffect(() => localStorage.setItem("name", name), [name]);
  useEffect(() => localStorage.setItem("age", age), [age]);
  useEffect(() => localStorage.setItem("gender", gender), [gender]);
  useEffect(() => localStorage.setItem("weight", weight), [weight]);
  useEffect(() => localStorage.setItem("height", height), [height]);
  useEffect(
    () => localStorage.setItem("activityLevel", activityLevel),
    [activityLevel]
  );
  useEffect(() => localStorage.setItem("goal", goal), [goal]);
  useEffect(() => localStorage.setItem("eatStart", eatStart), [eatStart]);
  useEffect(() => localStorage.setItem("eatEnd", eatEnd), [eatEnd]);
  useEffect(() => localStorage.setItem("bodyFat", bodyFat), [bodyFat]);
  useEffect(
    () =>
      localStorage.setItem("journalEntries", JSON.stringify(journalEntries)),
    [journalEntries]
  );

  const calculateBMR = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (!w || !h || !a) return null;

    if (gender === "male") {
      return 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      return 10 * w + 6.25 * h - 5 * a - 161;
    }
  };

  const leanBodyMass = useMemo(() => {
    if (!weight || !bodyFat) return null;
    const bf = parseFloat(bodyFat) / 100;
    const w = parseFloat(weight);
    if (isNaN(bf) || isNaN(w)) return null;
    return w * (1 - bf);
  }, [weight, bodyFat]);

  const calculateCalories = () => {
    const bmr = calculateBMR();
    if (!bmr) {
      setCalories(null);
      return;
    }
    let tdee = bmr * (activityMultipliers[activityLevel] || 1.2);
    if (goal === "lose") tdee *= 0.85;
    else if (goal === "gain") tdee *= 1.1;
    setCalories(Math.round(tdee));
  };

  useEffect(() => {
    calculateCalories();
  }, [weight, height, age, gender, activityLevel, goal]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const [startH, startM] = eatStart.split(":").map(Number);
      const [endH, endM] = eatEnd.split(":").map(Number);

      const eatStartTime = new Date(now);
      eatStartTime.setHours(startH, startM, 0, 0);

      const eatEndTime = new Date(now);
      eatEndTime.setHours(endH, endM, 0, 0);

      if (eatEndTime <= eatStartTime) {
        eatEndTime.setDate(eatEndTime.getDate() + 1);
      }

      let fastingDuration = 0;

      if (now >= eatEndTime && now < eatStartTime) {
        fastingDuration = (now - eatEndTime) / 1000 / 60;
      } else if (now >= eatStartTime && now < eatEndTime) {
        fastingDuration = 0;
      } else if (now < eatStartTime) {
        fastingDuration =
          (now - new Date(eatEndTime.getTime() - 24 * 60 * 60 * 1000)) /
          1000 /
          60;
      }

      setFastTime(fastingDuration);

      const minutesToReset = fastHours * 60 - fastingDuration;
      setTimeToReset(minutesToReset > 0 ? minutesToReset : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [eatStart, eatEnd, fastHours]);

  const formatDuration = (min) => {
    if (min < 0) min = 0;
    const h = Math.floor(min / 60);
    const m = Math.floor(min % 60);
    return `${h}h ${m}m`;
  };

  const addJournalEntry = () => {
    if (!journalDate)
      return alert("Please select a date for the journal entry");
    const entry = {
      date: journalDate,
      weight: journalWeight,
      mood: journalMood,
      energy: journalEnergy,
    };
    setJournalEntries([...journalEntries, entry]);
    setJournalDate("");
    setJournalWeight("");
    setJournalMood(moods[0]);
    setJournalEnergy(5);
  };

  const downloadJournalCSV = () => {
    const headers = ["Date", "Weight", "Mood", "Energy"];
    const rows = journalEntries.map((e) => [
      e.date,
      e.weight,
      e.mood,
      e.energy,
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "journal.csv");
    link.click();
  };

  const sendReportEmail = () => {
    if (!email) {
      alert("Please enter an email address.");
      return;
    }
    alert(`Simulated sending report to ${email} (no real email sent).`);
  };

  const getHoursDifference = (start, end) => {
    let diff = end - start;
    if (diff < 0) diff += 24;
    return diff;
  };

  const [startH, startM] = eatStart.split(":").map(Number);
  const [endH, endM] = eatEnd.split(":").map(Number);

  const startDecimal = startH + startM / 60;
  const endDecimal = endH + endM / 60;

  const feedingWindowHours = getHoursDifference(startDecimal, endDecimal);
  const fastingWindowHours = 24 - feedingWindowHours;

  const chartData = {
    labels: ["Eating Window", "Fasting Window"],
    datasets: [
      {
        label: "Hours",
        data: [feedingWindowHours, fastingWindowHours],
        backgroundColor: ["#bfa14b", "#7f7039"],
      },
    ],
  };

  const journalWeights = journalEntries
    .map((e) => ({ x: e.date, y: parseFloat(e.weight) || null }))
    .filter((e) => e.y !== null);
  const journalEnergyData = journalEntries.map((e) => ({
    x: e.date,
    y: e.energy,
  }));

  const journalWeightChart = {
    labels: journalWeights.map((e) => e.x),
    datasets: [
      {
        label: "Weight",
        data: journalWeights.map((e) => e.y),
        borderColor: "#bfa14b",
        backgroundColor: "#bfa14b88",
      },
    ],
  };

  const journalEnergyChart = {
    labels: journalEnergyData.map((e) => e.x),
    datasets: [
      {
        label: "Energy",
        data: journalEnergyData.map((e) => e.y),
        borderColor: "#7f7039",
        backgroundColor: "#7f703988",
      },
    ],
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#2e2e2e",
        padding: "1rem",
        lineHeight: 1.4,
      }}
    >
      <h1
        style={{ textAlign: "center", color: "#bfa14b", marginBottom: "1rem" }}
      >
        15 Hours Body Reset
      </h1>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            borderBottom: "2px solid #bfa14b",
            paddingBottom: "0.3rem",
            marginBottom: "1rem",
          }}
        >
          Personal Info
        </h2>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              fontSize: 14,
              marginTop: 3,
              boxSizing: "border-box",
            }}
            placeholder="Your name"
          />
        </label>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Age:
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              fontSize: 14,
              marginTop: 3,
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Gender:
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{ width: "100%", padding: 6, fontSize: 14, marginTop: 3 }}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Weight (kg):
          <input
            type="number"
            min={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              fontSize: 14,
              marginTop: 3,
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Height (cm):
          <input
            type="number"
            min={1}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              fontSize: 14,
              marginTop: 3,
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Body Fat % (optional):
          <input
            type="number"
            min={0}
            max={100}
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              fontSize: 14,
              marginTop: 3,
              boxSizing: "border-box",
            }}
            placeholder="Optional"
          />
        </label>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            borderBottom: "2px solid #bfa14b",
            paddingBottom: "0.3rem",
            marginBottom: "1rem",
          }}
        >
          Lifestyle
        </h2>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Activity Level:
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            style={{ width: "100%", padding: 6, fontSize: 14, marginTop: 3 }}
          >
            <option value="sedentary">Sedentary – little or no exercise</option>
            <option value="lightly">
              Lightly Active – exercise 1–3 days/week
            </option>
            <option value="moderately">
              Moderately Active – exercise 3–5 days/week
            </option>
            <option value="very">Very Active – exercise 6–7 days/week</option>
            <option value="extra">
              Extra Active – hard training or physical job
            </option>
          </select>
        </label>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Goal:
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            style={{ width: "100%", padding: 6, fontSize: 14, marginTop: 3 }}
          >
            <option value="maintain">Maintain Weight</option>
            <option value="lose">Lose Weight</option>
            <option value="gain">Gain Weight</option>
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Eating Window Start:
          <input
            type="time"
            value={eatStart}
            onChange={(e) => setEatStart(e.target.value)}
            style={{ width: "100%", padding: 6, fontSize: 14, marginTop: 3 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Eating Window End:
          <input
            type="time"
            value={eatEnd}
            onChange={(e) => setEatEnd(e.target.value)}
            style={{ width: "100%", padding: 6, fontSize: 14, marginTop: 3 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
          Fast Duration Goal (hours):
          <input
            type="number"
            min={1}
            max={24}
            value={fastHours}
            onChange={(e) => setFastHours(Number(e.target.value))}
            style={{
              width: "100%",
              padding: 6,
              fontSize: 14,
              marginTop: 3,
              boxSizing: "border-box",
            }}
          />
        </label>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            borderBottom: "2px solid #bfa14b",
            paddingBottom: "0.3rem",
            marginBottom: "1rem",
          }}
        >
          Calculated Results
        </h2>
        <p>
          <b>Calories per day:</b>{" "}
          {calories ? calories : "Please enter all required info"}
        </p>
        <p>
          <b>Current Fasting Time:</b> {formatDuration(fastTime)}
        </p>
        <p>
          <b>Time to Reset (fast duration goal):</b>{" "}
          {formatDuration(timeToReset)}
        </p>

        <div style={{ maxWidth: 320, marginTop: 16 }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            borderBottom: "2px solid #bfa14b",
            paddingBottom: "0.3rem",
            marginBottom: "1rem",
          }}
        >
          Journal Entries
        </h2>
        <div style={{ marginBottom: 12 }}>
          <input
            type="date"
            value={journalDate}
            onChange={(e) => setJournalDate(e.target.value)}
            style={{ padding: 6, fontSize: 14, marginRight: 6 }}
          />
          <input
            type="number"
            placeholder="Weight (kg)"
            value={journalWeight}
            onChange={(e) => setJournalWeight(e.target.value)}
            style={{ padding: 6, fontSize: 14, marginRight: 6, width: 100 }}
          />
          <select
            value={journalMood}
            onChange={(e) => setJournalMood(e.target.value)}
            style={{ padding: 6, fontSize: 14, marginRight: 6 }}
          >
            {moods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={10}
            placeholder="Energy (1-10)"
            value={journalEnergy}
            onChange={(e) => setJournalEnergy(Number(e.target.value))}
            style={{ padding: 6, fontSize: 14, width: 80 }}
          />
          <button
            onClick={addJournalEntry}
            style={{
              marginLeft: 8,
              padding: "6px 12px",
              backgroundColor: "#bfa14b",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Add
          </button>
        </div>

        {journalEntries.length > 0 && (
          <>
            <button
              onClick={downloadJournalCSV}
              style={{
                marginBottom: 12,
                padding: "6px 12px",
                backgroundColor: "#7f7039",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Download CSV
            </button>

            <div style={{ maxWidth: 600, marginBottom: 16 }}>
              <Line data={journalWeightChart} options={{ responsive: true }} />
            </div>
            <div style={{ maxWidth: 600 }}>
              <Line data={journalEnergyChart} options={{ responsive: true }} />
            </div>
          </>
        )}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            borderBottom: "2px solid #bfa14b",
            paddingBottom: "0.3rem",
            marginBottom: "1rem",
          }}
        >
          Email Report
        </h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 6,
            fontSize: 14,
            width: "100%",
            marginBottom: 8,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={sendReportEmail}
          style={{
            padding: "8px 16px",
            backgroundColor: "#bfa14b",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
            width: "100%",
          }}
        >
          Send Report
        </button>
      </section>

      <footer style={{ textAlign: "center", fontSize: 12, color: "#999" }}>
        &copy; 2025 15 Hours Body Reset
      </footer>
    </div>
  );
}
