"use client";

import { useEffect, useMemo, useState } from "react";
import { rubric1VO } from "../../lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";
type Status = "draft" | "published";

const MOCK_STUDENT = {
  id: "student-1",
  name: "Student Voorbeeld",
};

// Moet matchen met docentpage mock teacher id (voor nu)
const MOCK_TEACHER = {
  id: "teacher-1",
  name: "Docent Voorbeeld",
};

const STORAGE_KEY = "synergos_teacher_review_v1";

type TeacherItem = {
  score: number | null;
  feedback: string;
  status: Status;
  updatedAt: number;
  publishedAt?: number;
};

type TeacherStore = Record<string, TeacherItem>;

function makeKey(args: {
  studentId: string;
  teacherId: string;
  moment: Moment;
  themeId: string;
  questionId: string;
}) {
  const { studentId, teacherId, moment, themeId, questionId } = args;
  return `${studentId}__${teacherId}__${moment}__${themeId}__${questionId}`;
}

function scoreLabel(value: number) {
  const labels = rubric1VO.scale.labels;
  if (value <= 2) return labels[0];
  if
