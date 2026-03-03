import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";


export const fetchHabits = createAsyncThunk(
  "habits/fetchHabits",
  async () => {
    const res = await fetch("http://localhost:3000/api/habits");

    if (!res.ok) {
      throw new Error("Error al obtener hábitos");
    }

    return res.json();
  }
);


const habitsSlice = createSlice({
  name: "habits",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHabits.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHabits.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchHabits.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default habitsSlice.reducer;