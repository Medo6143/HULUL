import type { SurveyStore } from "../application/usecases";
import type { Survey } from "../domain/survey";

export class InMemorySurveyStore implements SurveyStore {
  private readonly items = new Map<string, Survey>();
  async list() {
    return [...this.items.values()];
  }
  async get(id: string) {
    return this.items.get(id) ?? null;
  }
  async findByToken(token: string) {
    return [...this.items.values()].find((s) => s.token === token) ?? null;
  }
  async save(survey: Survey) {
    this.items.set(survey.id, survey);
  }
  async delete(id: string) {
    this.items.delete(id);
  }
}
