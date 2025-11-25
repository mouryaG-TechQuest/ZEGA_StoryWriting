# How to Use AI Auto-Training Feature

## 🚀 Quick Start

Your AI Model Auto-Training feature is now fully integrated into your application!

## 📍 Where to Find It

1. **Start your application**:
   ```powershell
   cd Frontend
   npm run dev
   ```

2. **Navigate to Settings**:
   - Login to your application
   - Click on your **profile icon** (top-right corner)
   - Select **"Settings"** from the dropdown menu
   - In the Settings sidebar, click **"AI Training"**

## 🎯 What You'll See

### AI Training Interface

The AI Training page includes:

1. **Training Examples Slider** (1-500)
   - Drag to select how many training examples to generate
   - More examples = better AI model
   - Recommended: Start with 20-50 for testing

2. **Genre Selection** (8 genres available)
   - **Fantasy** - Magical worlds and epic quests
   - **Dark Fantasy** - Darker, grittier magical stories
   - **Sci-Fi** - Science fiction and technology
   - **Mystery** - Detective stories and puzzles
   - **Horror** - Scary and suspenseful tales
   - **Romance** - Love stories and relationships
   - **Adventure** - Action-packed journeys
   - **Thriller** - Suspenseful and intense stories
   
   Click genres to select/deselect (blue = selected)
   Leave empty to train on all genres equally

3. **Store in Database Toggle**
   - **OFF (Recommended)**: Training data stays separate, doesn't clutter your story database
   - **ON**: Also saves training data to RAG memory for enhanced context

4. **Train Button**
   - Click to start automatic training
   - Shows progress with spinner
   - Takes ~3 seconds per example (ensemble voting with 7 models)

### Results Display

After training completes, you'll see:

1. **Success Rate Card**
   - Percentage of successfully generated examples
   - Example: "100%" (5/5 success)

2. **Average Quality Card**
   - Quality score out of 10
   - Example: "8.7/10" (high quality)
   - Scores ≥7.0 are used for fine-tuning

3. **Examples Collected Card**
   - Total high-quality examples ready for fine-tuning
   - Updates with each training session

4. **Fine-Tuning Readiness**
   - Shows how many examples until auto fine-tuning
   - Auto-triggers at 50 examples
   - Manual trigger button available

5. **Genre Distribution Chart**
   - Visual breakdown of which genres were trained
   - Horizontal bar chart with percentages

6. **Training Statistics**
   - Total time taken
   - Examples generated
   - Success rate percentage

## 💡 Usage Examples

### Example 1: Quick Test (10 examples)
```
1. Set slider to: 10
2. Select genres: Fantasy, Sci-Fi
3. Store in database: OFF
4. Click "Start Training"
5. Wait ~30 seconds
6. Review results
```

### Example 2: Serious Training (50 examples)
```
1. Set slider to: 50
2. Select genres: Leave all (or choose favorites)
3. Store in database: OFF
4. Click "Start Training"
5. Wait ~2.5 minutes
6. Auto fine-tuning triggers!
7. Your personal AI model is created
```

### Example 3: Massive Training (200 examples)
```
1. Set slider to: 200
2. Select genres: All
3. Store in database: OFF
4. Click "Start Training"
5. Wait ~10 minutes
6. Multiple fine-tuning rounds
7. Highly specialized AI model created
```

## 🎓 Best Practices

### Starting Out
- Begin with **20-50 examples** to test the system
- Select **2-3 favorite genres** for focused training
- Keep **"Store in database" OFF** to avoid clutter

### Serious Training
- Use **100-200 examples** for best results
- Train on **all genres** for versatile AI
- Monitor quality scores (aim for ≥8.0)

### Production Use
- Run training sessions **weekly** to improve AI
- Track which genres give best quality
- Use fine-tuned models for story generation

## 📊 Understanding Results

### Quality Scores
- **9.0-10.0**: Excellent - Rich, detailed, well-structured
- **8.0-8.9**: Very Good - Good detail and flow
- **7.0-7.9**: Good - Adequate for training
- **<7.0**: Filtered out - Not used for fine-tuning

### Success Rate
- **100%**: Perfect - All examples generated successfully
- **90-99%**: Excellent - Occasional API issues
- **<90%**: Review logs - May need API key check

### Fine-Tuning Triggers
- **Automatic**: 50 examples collected
- **Manual**: Click "Trigger Fine-Tuning Now" button
- **Result**: Personal AI model created for your user ID

## 🔧 Technical Details

### What Happens During Training?

1. **Prompt Generation**
   - Random genre selected from your choices
   - Random training prompt picked (80 total)
   - Random style modifier applied (10 variations)

2. **Story Generation**
   - Ensemble voting with 7 teacher models:
     - Gemini (2 variants)
     - Groq (2 variants)
     - HuggingFace (2 variants)
     - Ollama (1 variant)
   - Best output selected based on voting

3. **Quality Estimation**
   - Base score: 7.0
   - Length bonus: 200-800 words optimal (+1.0)
   - Structure bonus: 3+ sentences (+0.5)
   - Descriptive words: 2+ per 100 words (+0.5)
   - Dialogue: Quotes present (+0.5)
   - Maximum score: 10.0

4. **Data Collection**
   - High-quality examples (≥7.0) saved for fine-tuning
   - Optional: Store in RAG memory if toggle ON
   - No stories created in main database

5. **Fine-Tuning**
   - Triggered at 50 examples
   - Creates personal AI model
   - Model ID: `{user_id}_finetuned_v{version}`
   - Learns your preferred writing style

### Performance Expectations

- **Speed**: ~3 seconds per example
- **10 examples**: ~30 seconds
- **50 examples**: ~2.5 minutes
- **100 examples**: ~5 minutes
- **200 examples**: ~10 minutes
- **500 examples**: ~25 minutes

### API Endpoints Used

- `GET /training/genres` - Fetch available genres
- `POST /auto-train` - Start training session

## 🐛 Troubleshooting

### "Error fetching genres"
- Check if ZEGA backend is running (http://localhost:8002)
- Verify API is accessible: `Invoke-RestMethod http://localhost:8002/training/genres`

### "Training failed"
- Check API keys (Gemini, Groq, HuggingFace)
- Review ZEGA logs for errors
- Try with fewer examples first (10-20)

### Slow performance
- Normal for ensemble voting (7 models)
- Reduce number of examples for faster testing
- Consider training in batches (50 at a time)

### Low quality scores
- Check which genres are producing low scores
- Review generated examples in results
- Some genres naturally score higher than others

## 🎉 Success Indicators

You'll know it's working when you see:
- ✅ Slider smoothly adjusts (1-500)
- ✅ Genre buttons toggle blue when clicked
- ✅ Training button shows spinner during generation
- ✅ Results cards populate with data
- ✅ Quality scores appear (hopefully ≥8.0)
- ✅ Fine-tuning readiness counter updates
- ✅ Genre distribution chart displays

## 🚀 Next Steps After Training

Once your AI model is trained:

1. **Use Fine-Tuned Model**
   - Generate stories using your personal AI
   - Prediction endpoint automatically uses fine-tuned model
   - Notice improved quality and style consistency

2. **Continue Training**
   - Add more examples weekly
   - Experiment with different genres
   - Track quality improvements over time

3. **Compare Performance**
   - Generate story with base model
   - Generate story with fine-tuned model
   - Compare quality, style, and coherence

## 📞 Need Help?

- Check `docs/AUTO_TRAINING.md` for detailed documentation
- Review `AUTO_TRAINING_COMPLETE.md` for implementation details
- Check ZEGA logs: Look for auto-training related messages
- Test API directly with PowerShell (examples in docs)

---

**Happy Training! 🎨✨**

Make your AI model the best storyteller it can be!
