#include "node-mecab.h"

using namespace v8;

Tagger::Tagger(const char *command) {
  this->tagger = MeCab::createTagger(command);
}

NAN_METHOD(Tagger::New) {
  if(!info.IsConstructCall()) {
    return Nan::ThrowError(Nan::New("Tagger::New - called without new keyword").ToLocalChecked());
  }

	if(info.Length() > 1 || (info.Length() == 1 && !info[0]->IsString())) {
    return Nan::ThrowError(Nan::New("Tagger::New - expected argument [string]").ToLocalChecked());
  }

  const char *command = (info.Length() == 1 && info[0]->IsString()) ? *Nan::Utf8String(info[0]->ToString()) : "";
	Tagger *t = new Tagger(command);
	t->Wrap(info.Holder());

  info.GetReturnValue().Set(info.Holder());
}

NAN_METHOD(Tagger::Parse){
  if (info.Length() != 1 || !info[0]->IsString()) {
		return Nan::ThrowError(Nan::New("Tagger::Parse - expected argument [string]").ToLocalChecked());
	}
  Tagger *self = Nan::ObjectWrap::Unwrap<Tagger>(info.This());

	Nan::Utf8String text(info[0]->ToString());

	const char *result = self->tagger->parse(*text);

  info.GetReturnValue().Set(Nan::New(result).ToLocalChecked());
}

Tagger::~Tagger(){
	delete this->tagger;
}

NAN_MODULE_INIT(init) {
	Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(Tagger::New);
	tpl->InstanceTemplate()->SetInternalFieldCount(1);
	tpl->SetClassName(Nan::New("Tagger").ToLocalChecked());

	Nan::SetPrototypeMethod(tpl, "parse", Tagger::Parse);
	Nan::Set(target, Nan::New("Tagger").ToLocalChecked(),
			     Nan::GetFunction(tpl).ToLocalChecked());
}

NODE_MODULE(mecab, init);
